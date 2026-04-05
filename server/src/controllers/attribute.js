const Attribute = require('../models/attribute');
const { redisClient } = require('../config/redis');

const attributeController = {

    async getAttributesByCategory(req, res) {
        try {
            const { categoryId } = req.params;

            const cacheKey = `attributes:category:${categoryId}`;
            const cachedAttributes = await redisClient.get(cacheKey);
            if (cachedAttributes) {
                return res.status(200).json(JSON.parse(cachedAttributes));
            }

            const attributes = await Attribute.findByCategoryId(categoryId);

            await redisClient.set(cacheKey, JSON.stringify(attributes));

            res.status(200).json(attributes);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving attributes", error: error.message });
        }
    }
};

module.exports = attributeController;