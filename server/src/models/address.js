const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./user');

const AddressModel = sequelize.define('Address', {
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
    addressType: {
        type: DataTypes.ENUM('shipping', 'billing', 'provider'),
        allowNull: false,
        defaultValue: 'shipping',
        field: 'addressType'
    },
    street: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    state: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    zipCode: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: 'zipCode'
    },
    country: {
        type: DataTypes.STRING(100),
        allowNull: false,
    }
}, {
    tableName: 'addresses',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

AddressModel.belongsTo(User.Model, { foreignKey: 'userId', as: 'user' });
User.Model.hasMany(AddressModel, { foreignKey: 'userId', as: 'addresses' });

const Address = {
    create(addressData) {
        return AddressModel.create(addressData);
    },

    findByUserId(userId) {
        return AddressModel.findAll({ where: { userId } });
    },

    findAllWithUsers() {
        return AddressModel.findAll({
            include: [{
                model: User.Model,
                as: 'user',
                attributes: ['firstName', 'lastName', 'email', 'role']
            }],
            order: [['id', 'DESC']]
        });
    },

    update(id, data) {
        return AddressModel.update(data, { where: { id } });
    },

    delete(id) {
        return AddressModel.destroy({ where: { id } });
    }
};

Address.Model = AddressModel;

module.exports = Address;