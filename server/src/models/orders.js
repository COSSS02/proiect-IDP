const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');
const Address = require('./address');
const Product = require('./products');
const Cart = require('./cart');

const OrderModel = sequelize.define('Order', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false, field: 'userId', references: { model: User.Model, key: 'id' }, onDelete: 'CASCADE' },
    shippingAddressId: { type: DataTypes.INTEGER, allowNull: false, field: 'shippingAddressId', references: { model: Address.Model, key: 'id' } },
    billingAddressId: { type: DataTypes.INTEGER, allowNull: false, field: 'billingAddressId', references: { model: Address.Model, key: 'id' } },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'totalAmount' },
    stripeSessionId: { type: DataTypes.STRING, unique: true, field: 'stripeSessionId' },
}, {
    tableName: 'orders',
    timestamps: true,
    updatedAt: false,
    createdAt: 'createdAt'
});

const OrderItemModel = sequelize.define('OrderItem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false, field: 'orderId', references: { model: OrderModel, key: 'id' }, onDelete: 'CASCADE' },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'productId', references: { model: Product.Model, key: 'id' } },
    quantity: { type: DataTypes.INTEGER, allowNull: false },
    priceAtPurchase: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'priceAtPurchase' },
    status: { type: DataTypes.ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'), allowNull: false, defaultValue: 'Pending' },
}, {
    tableName: 'order_items',
    timestamps: false
});

OrderModel.belongsTo(User.Model, { as: 'user', foreignKey: 'userId' });
User.Model.hasMany(OrderModel, { as: 'orders', foreignKey: 'userId' });

OrderModel.belongsTo(Address.Model, { as: 'shippingAddress', foreignKey: 'shippingAddressId' });
OrderModel.belongsTo(Address.Model, { as: 'billingAddress', foreignKey: 'billingAddressId' });

OrderModel.hasMany(OrderItemModel, { as: 'items', foreignKey: 'orderId' });
OrderItemModel.belongsTo(OrderModel, { as: 'order', foreignKey: 'orderId' });

OrderItemModel.belongsTo(Product.Model, { as: 'product', foreignKey: 'productId' });

const getEffectiveUnitPrice = (product) => {
    const price = Number(product.price || 0);
    const dprice = Number(product.discountPrice || 0);
    const start = product.discountStartDate ? new Date(product.discountStartDate) : null;
    const end = product.discountEndDate ? new Date(product.discountEndDate) : null;
    const now = new Date();
    const isActive = dprice > 0 && start && end && now >= start && now <= end && dprice < price;
    return isActive ? dprice : price;
};

const Order = {
    async createFromCart(userId, { shippingAddressId, billingAddressId, stripeSessionId }) {
        return sequelize.transaction(async (t) => {
            const cartItems = await Cart.getByUserId(userId);
            if (cartItems.length === 0) throw new Error("Cart is empty.");

            let calculatedTotal = 0;
            const orderItemsData = [];

            for (const item of cartItems) {
                const product = item.product;
                if (item.quantity > product.stockQuantity) {
                    throw new Error(`Not enough stock for ${product.name}.`);
                }
                const unitPrice = getEffectiveUnitPrice(product);
                calculatedTotal += unitPrice * item.quantity;
                orderItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    priceAtPurchase: unitPrice
                });
            }

            const order = await OrderModel.create({
                userId,
                shippingAddressId,
                billingAddressId,
                totalAmount: calculatedTotal,
                stripeSessionId
            }, { transaction: t });

            await OrderItemModel.bulkCreate(orderItemsData.map(item => ({ ...item, orderId: order.id })), { transaction: t });

            for (const item of orderItemsData) {
                await Product.Model.decrement('stockQuantity', { by: item.quantity, where: { id: item.productId }, transaction: t });
            }

            await Cart.clear(userId, t);

            return { orderId: order.id, message: "Order placed successfully!" };
        });
    },

    findByUserId(userId) {
        return OrderModel.findAll({
            where: { userId },
            include: [{
                model: OrderItemModel,
                as: 'items',
                include: [{ model: Product.Model, as: 'product', attributes: ['name'] }]
            }],
            order: [['createdAt', 'DESC']]
        });
    },

    findByStripeSessionId(sessionId) {
        return OrderModel.findOne({
            where: { stripeSessionId: sessionId },
            attributes: ['id']
        });
    },

    findItemsByProviderId(providerId) {
        return OrderItemModel.findAll({
            include: [
                { model: Product.Model, as: 'product', where: { providerId }, attributes: ['id', 'name'] },
                {
                    model: OrderModel, as: 'order', attributes: ['createdAt'],
                    include: [
                        { model: User.Model, as: 'user', attributes: ['firstName', 'lastName'] },
                        { model: Address.Model, as: 'shippingAddress', attributes: [['street', 'shipping_street'], ['city', 'shipping_city'], ['state', 'shipping_state'], ['zipCode', 'shipping_postal_code'], ['country', 'shipping_country']] }
                    ]
                }
            ],
            order: [[{ model: OrderModel, as: 'order' }, 'createdAt', 'DESC']]
        });
    },

    async updateItemStatus(orderItemId, user, newStatus) {
        const item = await OrderItemModel.findByPk(orderItemId, { include: [{ model: Product.Model, as: 'product', attributes: ['providerId'] }] });
        if (!item) throw new Error("Order item not found.");

        if (user.role !== 'admin' && (user.role !== 'provider' || item.product.providerId !== user.id)) {
            throw new Error("User not authorized to update order status.");
        }

        item.status = newStatus;
        await item.save();
        return true;
    },

    async getSalesStats(providerId) {
        const result = await OrderItemModel.findOne({
            attributes: [
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.literal('quantity * priceAtPurchase')), 0), 'totalRevenue'],
                [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('orderId'))), 'totalOrders'],
                [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('quantity')), 0), 'totalItemsSold']
            ],
            include: [{ model: Product.Model, as: 'product', where: { providerId }, attributes: [] }],
            where: { status: { [Op.notIn]: ['Cancelled', 'Pending'] } },
            raw: true
        });
        return result;
    },

    async getRecentOrders(providerId, limit = 5) {
        const items = await OrderItemModel.findAll({
            attributes: ['orderId'],
            include: [{ model: Product.Model, as: 'product', where: { providerId }, attributes: [] }],
            group: ['orderId'],
            order: [[sequelize.literal('MAX(`order`.`createdAt`)'), 'DESC']],
            limit: limit,
            include: [{ model: OrderModel, as: 'order', attributes: [] }]
        });
        const orderIds = items.map(item => item.orderId);
        if (orderIds.length === 0) return [];

        return OrderModel.findAll({
            where: { id: { [Op.in]: orderIds } },
            include: [{ model: OrderItemModel, as: 'items', include: [{ model: Product.Model, as: 'product', attributes: ['name'] }] }],
            order: [['createdAt', 'DESC']]
        });
    },

    async getTopSellers(providerId, limit = 5) {
        return OrderItemModel.findAll({
            attributes: [
                'productId',
                [sequelize.fn('SUM', sequelize.col('quantity')), 'total_sold']
            ],
            include: [{ model: Product.Model, as: 'product', where: { providerId }, attributes: ['name'] }],
            group: ['productId'],
            order: [[sequelize.literal('total_sold'), 'DESC']],
            limit
        });
    },

    async findAll({ limit, offset, sortBy, sortOrder, searchTerm }) {
        const whereClause = searchTerm ? {
            [Op.or]: [
                { id: { [Op.like]: `%${searchTerm}%` } },
                { '$user.email$': { [Op.like]: `%${searchTerm}%` } },
                { [Op.and]: sequelize.where(sequelize.fn('CONCAT', sequelize.col('user.firstName'), ' ', sequelize.col('user.lastName')), { [Op.like]: `%${searchTerm}%` }) }
            ]
        } : {};

        return OrderModel.findAndCountAll({
            where: whereClause,
            include: [
                { model: User.Model, as: 'user', attributes: ['firstName', 'lastName', 'email'] },
                { model: Address.Model, as: 'shippingAddress', attributes: [['street', 'shipping_street'], ['city', 'shipping_city']] },
                { model: OrderItemModel, as: 'items', include: [{ model: Product.Model, as: 'product', attributes: ['name'] }] }
            ],
            order: [[sortBy, sortOrder]],
            limit,
            offset,
            distinct: true
        });
    },

    deleteById(orderId) {
        return OrderModel.destroy({ where: { id: orderId } });
    },

    async getPlatformSalesStats() {
        const sales = await OrderModel.findOne({
            attributes: [
                [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalRevenue'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders']
            ],
            raw: true
        });
        const items = await OrderItemModel.findOne({
            attributes: [[sequelize.fn('SUM', sequelize.col('quantity')), 'totalItemsSold']],
            raw: true
        });
        return { ...sales, ...items };
    },

    getRecentPlatformOrders(limit = 5) {
        return OrderModel.findAll({
            include: [{ model: User.Model, as: 'user', attributes: ['firstName', 'lastName'] }],
            order: [['createdAt', 'DESC']],
            limit
        });
    }
};

Order.Model = OrderModel;
Order.ItemModel = OrderItemModel;

module.exports = Order;