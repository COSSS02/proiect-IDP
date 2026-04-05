const User = require('../models/user');
const { redisClient } = require('../config/redis');

const userController = {

    async getAllUsers(req, res) {
        try {
            const users = await User.findAll();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: "Error fetching users", error: error.message });
        }
    },

    async updateUserByAdmin(req, res) {
        try {
            const { userId } = req.params;

            const cacheKey = `user:${req.body.email}`;
            await redisClient.del(cacheKey);

            await User.updateUserAsAdmin(userId, req.body);
            res.status(200).json({ message: "User updated successfully." });
        } catch (error) {
            res.status(500).json({ message: "Error updating user", error: error.message });
        }
    },

    async deleteUserByAdmin(req, res) {
        try {
            const { userId } = req.params;

            const userToDelete = await User.Model.findByPk(userId, { attributes: ['email'] });
            if (userToDelete) {
                const cacheKey = `user:${userToDelete.email}`;
                await redisClient.del(cacheKey);
            }

            await User.deleteById(userId);
            res.status(200).json({ message: "User deleted successfully." });
        } catch (error) {
            res.status(500).json({ message: "Error deleting user", error: error.message });
        }
    }
};

module.exports = userController;