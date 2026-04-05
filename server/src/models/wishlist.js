const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');
const Product = require('./products');
const Category = require('./category');

const WishlistModel = sequelize.define('Wishlist', {
    userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'userId',
        references: {
            model: User.Model,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    productId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        field: 'productId',
        references: {
            model: Product.Model,
            key: 'id'
        },
        onDelete: 'CASCADE'
    }
}, {
    tableName: 'wishlists',
    timestamps: true,
    updatedAt: false,
    createdAt: 'createdAt'
});

User.Model.belongsToMany(Product.Model, {
    through: WishlistModel,
    foreignKey: 'userId',
    otherKey: 'productId',
    as: 'wishlistProducts'
});
Product.Model.belongsToMany(User.Model, {
    through: WishlistModel,
    foreignKey: 'productId',
    otherKey: 'userId',
    as: 'wishlistedByUsers'
});

WishlistModel.belongsTo(Product.Model, { foreignKey: 'productId' });
WishlistModel.belongsTo(User.Model, { foreignKey: 'userId' });
Product.Model.hasMany(WishlistModel, { foreignKey: 'productId' });
User.Model.hasMany(WishlistModel, { foreignKey: 'userId' });

const Wishlist = {

    add(userId, productId) {
        return WishlistModel.findOrCreate({
            where: { userId, productId }
        });
    },

    remove(userId, productId) {
        return WishlistModel.destroy({
            where: { userId, productId }
        });
    },

    findByUserId(userId) {
        return Product.Model.findAll({
            include: [
                {
                    model: WishlistModel,
                    where: { userId },
                    attributes: []
                },
                {
                    model: Category.Model,
                    as: 'category',
                    attributes: ['name']
                }
            ],
            attributes: ['id', 'name', 'description', 'price', 'stockQuantity'],
            order: [[WishlistModel, 'createdAt', 'DESC']]
        });
    }
};

Wishlist.Model = WishlistModel;

module.exports = Wishlist;