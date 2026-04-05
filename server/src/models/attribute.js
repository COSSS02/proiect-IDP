const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Category = require('./category');

const AttributeModel = sequelize.define('Attribute', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'categoryId',
        references: {
            model: Category.Model,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'attributes',
    timestamps: false,
    indexes: [
        {
            unique: true,
            fields: ['name', 'categoryId']
        }
    ]
});

const Attribute = {
    findByCategoryId(categoryId) {
        return AttributeModel.findAll({
            where: { categoryId },
            order: [['name', 'ASC']]
        });
    }
};

Attribute.Model = AttributeModel;

module.exports = Attribute;