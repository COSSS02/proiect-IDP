const Category = require('../models/category');
const { redisClient } = require('../config/redis');

const categoryController = {

    async createCategory(req, res) {
        try {
            const { name, description } = req.body;
            if (!name) {
                return res.status(400).json({ message: "Category name is required." });
            }
            const result = await Category.create({ name, description });

            const cacheKey = 'all_categories';
            await redisClient.del(cacheKey);

            res.status(201).json({ message: "Category created successfully", categoryId: result.id });
        } catch (error) {
            res.status(500).json({ message: "Error creating category", error: error.message });
        }
    },

    async getAllCategories(req, res) {
        try {
            const cacheKey = 'all_categories';

            const cachedCategories = await redisClient.get(cacheKey);
            if (cachedCategories) {
                return res.status(200).json(JSON.parse(cachedCategories));
            }

            const categories = await Category.findAll();

            await redisClient.set(cacheKey, JSON.stringify(categories));

            res.status(200).json(categories);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving categories", error: error.message });
        }
    }
}

module.exports = categoryController;