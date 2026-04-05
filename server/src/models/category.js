const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const CategoryModel = sequelize.define('Category', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
    }
}, {
    tableName: 'categories',
    timestamps: false
});

const Category = {
    create(categoryData) {
        return CategoryModel.create(categoryData);
    },

    findByName(categoryName) {
        return CategoryModel.findOne({ where: { name: categoryName } });
    },

    findAll() {
        return CategoryModel.findAll({ order: [['name', 'ASC']] });
    },
};

Category.Model = CategoryModel;

module.exports = Category;