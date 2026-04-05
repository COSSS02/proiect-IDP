const Wishlist = require('../models/wishlist');
const { redisClient } = require('../config/redis');

const wishlistController = {

    async getWishlist(req, res) {
        try {
            const cacheKey = `wishlist:${req.user.id}`;

            const cachedWishlist = await redisClient.get(cacheKey);
            if (cachedWishlist) {
                return res.status(200).json(JSON.parse(cachedWishlist));
            }

            const products = await Wishlist.findByUserId(req.user.id);

            await redisClient.set(cacheKey, JSON.stringify(products));

            res.status(200).json(products);
        } catch (error) {
            res.status(500).json({ message: "Error fetching wishlist", error: error.message });
        }
    },

    async addToWishlist(req, res) {
        try {
            const { productId } = req.body;
            const w = await Wishlist.add(req.user.id, productId);

            const cacheKey = `wishlist:${req.user.id}`;
            const d = await redisClient.del(cacheKey);

            res.status(201).json({ message: "Product added to wishlist" });
        } catch (error) {
            res.status(500).json({ message: "Error adding to wishlist", error: error.message });
        }
    },

    async removeFromWishlist(req, res) {
        try {
            const { productId } = req.params;
            await Wishlist.remove(req.user.id, productId);

            const cacheKey = `wishlist:${req.user.id}`;
            await redisClient.del(cacheKey);

            res.status(200).json({ message: "Product removed from wishlist" });
        } catch (error) {
            res.status(500).json({ message: "Error removing from wishlist", error: error.message });
        }
    }
};

module.exports = wishlistController;