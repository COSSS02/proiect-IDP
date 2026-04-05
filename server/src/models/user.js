const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/db');

const UserModel = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    keycloakId: {
        type: DataTypes.STRING(36),
        field: 'keycloakId',
        unique: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    firstName: {
        type: DataTypes.STRING,
        field: 'firstName',
        allowNull: false,
    },
    lastName: {
        type: DataTypes.STRING,
        field: 'lastName',
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('client', 'admin', 'provider'),
        allowNull: false,
        defaultValue: 'client',
    },
    companyName: {
        type: DataTypes.STRING,
        field: 'companyName',
    },
    stripeCustomerId: {
        type: DataTypes.STRING,
        field: 'stripeCustomerId',
    },
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
});

const User = {
    create(userData) {
        return UserModel.create(userData);
    },

    findByKeycloakId(keycloakId) {
        return UserModel.findOne({ where: { keycloakId } });
    },

    findByEmail(email) {
        return UserModel.findOne({ where: { email } });
    },

    async getStripeCustomerId(userId) {
        const user = await UserModel.findByPk(userId, { attributes: ['stripeCustomerId'] });
        return user ? user.stripeCustomerId : null;
    },

    setStripeCustomerId(userId, stripeCustomerId) {
        return UserModel.update({ stripeCustomerId }, { where: { id: userId } });
    },

    updateRoleAndCompany(userId, role, companyName) {
        return UserModel.update({ role, companyName }, { where: { id: userId } });
    },

    findAll() {
        return UserModel.findAll({
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'companyName', 'createdAt'],
            order: [['createdAt', 'DESC']],
        });
    },

    updateUserAsAdmin(userId, userData) {
        const { keycloakId, ...updatableData } = userData;
        return UserModel.update(updatableData, { where: { id: userId } });
    },

    deleteById(userId) {
        return UserModel.destroy({ where: { id: userId } });
    },

    async getPlatformStats() {
        const stats = await UserModel.findAll({
            attributes: ['role', [sequelize.fn('COUNT', sequelize.col('role')), 'count']],
            group: ['role']
        });

        const totalUsers = await UserModel.count();
        const platformStats = stats.reduce((acc, row) => {
            acc[`${row.get('role')}s`] = row.get('count');
            return acc;
        }, {});

        return { ...platformStats, totalUsers };
    },

    getRecentUsers(limit = 5) {
        return UserModel.findAll({
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'],
            order: [['createdAt', 'DESC']],
            limit: limit,
        });
    },
};

User.Model = UserModel;

module.exports = User;