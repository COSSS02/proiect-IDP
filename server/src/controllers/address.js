const Address = require('../models/address');
const { redisClient } = require('../config/redis');

const addressController = {

    async createAddress(req, res) {
        try {
            const userId = req.user.id;
            const { addressType, street, city, state, zipCode, country } = req.body;

            // Add validation to ensure addressType is provided and is one of the allowed values.
            if (!addressType || !['shipping', 'billing'].includes(addressType)) {
                return res.status(400).json({ message: "A valid address type ('shipping' or 'billing') is required." });
            }

            const result = await Address.create({ userId, addressType, street, city, state, zipCode, country });

            const cacheKey = `addresses:${userId}`;
            await redisClient.del(cacheKey);

            res.status(201).json({ message: "Address created successfully", addressId: result.id });
        } catch (error) {
            res.status(500).json({ message: "Error creating address", error: error.message });
        }
    },

    async getMyAddresses(req, res) {
        try {
            const userId = req.user.id;

            const cacheKey = `addresses:${userId}`;

            const cachedAddresses = await redisClient.get(cacheKey);
            if (cachedAddresses) {
                return res.status(200).json(JSON.parse(cachedAddresses));
            }

            const addresses = await Address.findByUserId(userId);

            await redisClient.set(cacheKey, JSON.stringify(addresses));

            res.status(200).json(addresses);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving addresses", error: error.message });
        }
    },

    async getAllAddresses(req, res) {
        try {
            const rows = await Address.findAllWithUsers();
            res.status(200).json(rows);
        } catch (error) {
            res.status(500).json({ message: "Error fetching addresses", error: error.message });
        }
    },

    async updateAddress(req, res) {
        try {
            const { addressId } = req.params;

            const addressToUpdate = await Address.Model.findByPk(addressId, { attributes: ['userId'] });
            if (addressToUpdate) {
                const cacheKey = `addresses:${addressToUpdate.userId}`;
                await redisClient.del(cacheKey);
            }

            await Address.update(addressId, req.body);
            res.status(200).json({ message: "Address updated successfully." });
        } catch (error) {
            res.status(500).json({ message: "Error updating address", error: error.message });
        }
    },

    async deleteAddress(req, res) {
        try {
            const { addressId } = req.params;

            const addressToDelete = await Address.Model.findByPk(addressId, { attributes: ['userId'] });
            if (addressToDelete) {
                const cacheKey = `addresses:${addressToDelete.userId}`;
                await redisClient.del(cacheKey);
            }

            await Address.delete(addressId);
            res.status(200).json({ message: "Address deleted successfully." });
        } catch (error) {
            res.status(500).json({ message: "Error deleting address", error: error.message });
        }
    }
};

module.exports = addressController;