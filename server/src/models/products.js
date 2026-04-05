const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');
const Category = require('./category');
const Attribute = require('./attribute');

const ProductModel = sequelize.define('Product', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    providerId: { type: DataTypes.INTEGER, allowNull: false, field: 'providerId', references: { model: User.Model, key: 'id' }, onDelete: 'CASCADE' },
    categoryId: { type: DataTypes.INTEGER, allowNull: false, field: 'categoryId', references: { model: Category.Model, key: 'id' }, onDelete: 'CASCADE' },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    stockQuantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'stockQuantity' },
    discountPrice: { type: DataTypes.DECIMAL(10, 2), field: 'discountPrice' },
    discountStartDate: { type: DataTypes.DATE, field: 'discountStartDate' },
    discountEndDate: { type: DataTypes.DATE, field: 'discountEndDate' },
}, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

const ProductAttributeModel = sequelize.define('ProductAttribute', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'productId', references: { model: ProductModel, key: 'id' }, onDelete: 'CASCADE' },
    attributeId: { type: DataTypes.INTEGER, allowNull: false, field: 'attributeId', references: { model: Attribute.Model, key: 'id' }, onDelete: 'CASCADE' },
    value: { type: DataTypes.STRING, allowNull: false },
}, {
    tableName: 'product_attributes',
    timestamps: false
});

ProductModel.belongsTo(User.Model, { as: 'provider', foreignKey: 'providerId' });
ProductModel.belongsTo(Category.Model, { as: 'category', foreignKey: 'categoryId' });
ProductModel.hasMany(ProductAttributeModel, { as: 'productAttributes', foreignKey: 'productId' });

ProductAttributeModel.belongsTo(Attribute.Model, { as: 'attribute', foreignKey: 'attributeId' });
ProductAttributeModel.belongsTo(ProductModel, { as: 'product', foreignKey: 'productId' });

Attribute.Model.hasMany(ProductAttributeModel, { as: 'productValues', foreignKey: 'attributeId' });

const Product = {
    async create(productData, attributesData) {
        return sequelize.transaction(async (t) => {
            const product = await ProductModel.create(productData, { transaction: t });

            for (const attr of attributesData) {
                if (!attr.attributeName || !attr.value) continue;

                const [attribute] = await Attribute.Model.findOrCreate({
                    where: { name: attr.attributeName, categoryId: product.categoryId },
                    transaction: t
                });

                await ProductAttributeModel.create({
                    productId: product.id,
                    attributeId: attribute.id,
                    value: attr.value
                }, { transaction: t });
            }
            return product.id;
        });
    },

    async update(productId, user, productData, attributesData) {
        return sequelize.transaction(async (t) => {
            const product = await ProductModel.findByPk(productId, { transaction: t });
            if (!product) throw new Error("Product not found.");
            if (user.role !== 'admin' && product.providerId !== user.id) {
                throw new Error("User not authorized to edit this product.");
            }

            await product.update(productData, { transaction: t });

            await ProductAttributeModel.destroy({ where: { productId: productId } }, { transaction: t });

            for (const attr of attributesData) {
                if (!attr.attributeName || !attr.value) continue;

                const [attribute] = await Attribute.Model.findOrCreate({
                    where: { name: attr.attributeName, categoryId: product.categoryId },
                    transaction: t
                });

                await ProductAttributeModel.create({
                    productId: product.id,
                    attributeId: attribute.id,
                    value: attr.value
                }, { transaction: t });
            }
            return true;
        });
    },

    async delete(productId) {
        const result = await ProductModel.destroy({ where: { id: productId } });
        if (result === 0) {
            throw new Error("Product not found or already deleted.");
        }
        return true;
    },

    async findById(productId) {
        return ProductModel.findByPk(productId, {
            include: [
                { model: Category.Model, as: 'category', attributes: ['name'] },
                { model: User.Model, as: 'provider', attributes: ['companyName'] },
                {
                    model: ProductAttributeModel,
                    as: 'productAttributes',
                    attributes: ['value'],
                    include: [{ model: Attribute.Model, as: 'attribute', attributes: ['name'] }]
                }
            ]
        });
    },

    async findByProviderId(providerId, limit, offset, sortBy = 'name', sortOrder = 'ASC') {
        const order = this._getOrderBy(sortBy, sortOrder);
        return ProductModel.findAndCountAll({
            where: { providerId },
            include: [{ model: Category.Model, as: 'category', attributes: ['name'] }],
            limit,
            offset,
            order
        });
    },

    async search(searchTerm, limit, offset, sortBy = 'name', sortOrder = 'ASC') {
        const searchPattern = `%${searchTerm}%`;
        const order = this._getOrderBy(sortBy, sortOrder);
        return ProductModel.findAndCountAll({
            where: {
                [Op.or]: [
                    { name: { [Op.like]: searchPattern } },
                    { description: { [Op.like]: searchPattern } },
                    { '$category.name$': { [Op.like]: searchPattern } }
                ]
            },
            include: [{ model: Category.Model, as: 'category', attributes: ['name'] }],
            limit,
            offset,
            order
        });
    },

    async findByCategoryName(categoryName, limit, offset, sortBy = 'name', sortOrder = 'ASC', filters = {}) {
        const order = this._getOrderBy(sortBy, sortOrder);
        const filterKeys = Object.keys(filters);

        const whereClause = {};
        if (filterKeys.length > 0) {
            whereClause[Op.and] = filterKeys.map(key => {
                return sequelize.literal(`EXISTS (
                    SELECT 1 FROM product_attributes pa
                    JOIN attributes a ON pa.attributeId = a.id
                    WHERE pa.productId = \`Product\`.\`id\` AND a.name = '${key}' AND pa.value = '${filters[key]}'
                )`);
            });
        }

        return ProductModel.findAndCountAll({
            where: whereClause,
            include: [{
                model: Category.Model,
                as: 'category',
                where: { name: categoryName },
                attributes: ['name']
            }],
            limit,
            offset,
            order,
            subQuery: false
        });
    },

    async findAll(limit, offset, sortBy = 'name', sortOrder = 'ASC', searchTerm = '') {
        const order = this._getOrderBy(sortBy, sortOrder);
        const whereClause = searchTerm ? {
            [Op.or]: [
                { name: { [Op.like]: `%${searchTerm}%` } },
                { description: { [Op.like]: `%${searchTerm}%` } },
                { '$category.name$': { [Op.like]: `%${searchTerm}%` } }
            ]
        } : {};

        return ProductModel.findAndCountAll({
            where: whereClause,
            include: [
                { model: Category.Model, as: 'category', attributes: ['name'] },
                { model: User.Model, as: 'provider', attributes: ['firstName', 'lastName', 'companyName'] }
            ],
            limit,
            offset,
            order,
            distinct: true,
            col: 'id'
        });

    },

    getLowStock(providerId, threshold = 5) {
        return ProductModel.findAll({
            where: {
                providerId,
                stockQuantity: { [Op.gt]: 0, [Op.lte]: threshold }
            },
            attributes: ['id', 'name', 'stockQuantity'],
            order: [['stockQuantity', 'ASC']]
        });
    },

    async getPlatformStats() {
        const totalProducts = await ProductModel.count();
        const outOfStockCount = await ProductModel.count({ where: { stockQuantity: 0 } });
        return { totalProducts, outOfStockCount };
    },

    _getOrderBy(sortBy, sortOrder) {
        const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        const validSortColumns = ['name', 'price', 'createdAt', 'stockQuantity'];

        if (sortBy === 'discount') {
            return [[sequelize.literal('CASE WHEN discountPrice IS NOT NULL AND NOW() BETWEEN discountStartDate AND discountEndDate THEN ((price - discountPrice) / price) ELSE -1 END'), safeSortOrder]];
        }
        if (validSortColumns.includes(sortBy)) {
            return [[sortBy, safeSortOrder]];
        }
        return [['name', 'ASC']];
    }
};

Product.Model = ProductModel;
Product.AttributeModel = ProductAttributeModel;

module.exports = Product;