const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');
const Product = require('./products');

const CartItemModel = sequelize.define('CartItem', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'userId',
        references: {
            model: User.Model,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    productId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'productId',
        references: {
            model: Product.Model,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
}, {
    tableName: 'cart_items',
    timestamps: true,
    updatedAt: false,
    createdAt: 'createdAt',
    indexes: [
        {
            unique: true,
            fields: ['userId', 'productId']
        }
    ]
});

CartItemModel.belongsTo(User.Model, { foreignKey: 'userId' });
User.Model.hasMany(CartItemModel, { foreignKey: 'userId', as: 'cartItems' });

CartItemModel.belongsTo(Product.Model, { foreignKey: 'productId', as: 'product' });
Product.Model.hasMany(CartItemModel, { foreignKey: 'productId' });


const Cart = {
    getByUserId(userId) {
        return CartItemModel.findAll({
            where: { userId },
            include: [{
                model: Product.Model,
                as: 'product',
                attributes: [
                    'name',
                    'price',
                    'stockQuantity',
                    'discountPrice',
                    'discountStartDate',
                    'discountEndDate'
                ]
            }],
            order: [['createdAt', 'DESC']]
        });
    },

    async addItem(userId, productId, quantity) {
        const existingItem = await CartItemModel.findOne({ where: { userId, productId } });

        if (existingItem) {
            return existingItem.increment('quantity', { by: quantity });
        } else {
            return CartItemModel.create({ userId, productId, quantity });
        }
    },

    updateItemQuantity(userId, productId, quantity) {
        if (quantity <= 0) {
            return this.removeItem(userId, productId);
        }
        return CartItemModel.update({ quantity }, {
            where: { userId, productId }
        });
    },

    removeItem(userId, productId) {
        return CartItemModel.destroy({
            where: { userId, productId }
        });
    },

    clear(userId, transaction) {
        return CartItemModel.destroy({
            where: { userId },
            transaction
        });
    }
};

Cart.Model = CartItemModel;

module.exports = Cart;