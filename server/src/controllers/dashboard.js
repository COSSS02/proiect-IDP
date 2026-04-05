const Product = require('../models/products');
const Order = require('../models/orders');
const User = require('../models/user');
const { redisClient } = require('../config/redis');

const dashboardController = {

    async getAdminDashboard(req, res) {
        const cacheKey = 'admin_dashboard_data';
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.status(200).json(JSON.parse(cachedData));
        }

        try {
            const [
                userStats,
                productStats,
                salesStats,
                recentOrders,
                recentUsers
            ] = await Promise.all([
                User.getPlatformStats(),
                Product.getPlatformStats(),
                Order.getPlatformSalesStats(),
                Order.getRecentPlatformOrders(5),
                User.getRecentUsers(5)
            ]);

            await redisClient.setEx(cacheKey, 300, JSON.stringify({
                userStats,
                productStats,
                salesStats,
                recentOrders,
                recentUsers
            }));

            res.status(200).json({
                userStats,
                productStats,
                salesStats,
                recentOrders,
                recentUsers
            });
        } catch (error) {
            res.status(500).json({ message: "Error fetching admin dashboard data", error: error.message });
        }
    },

    async getProviderDashboard(req, res) {
        try {
            const providerId = req.user.id;

            const cacheKey = `provider_dashboard_data:${providerId}`;
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                return res.status(200).json(JSON.parse(cachedData));
            }

            const [
                salesStats,
                lowStockProducts,
                topSellers,
                recentOrders
            ] = await Promise.all([
                Order.getSalesStats(providerId),
                Product.getLowStock(providerId, 5),
                Order.getTopSellers(providerId, 5),
                Order.getRecentOrders(providerId, 5)
            ]);

            await redisClient.setEx(cacheKey, 300, JSON.stringify({
                salesStats,
                lowStockProducts,
                topSellers,
                recentOrders
            }));

            res.status(200).json({
                salesStats,
                lowStockProducts,
                topSellers,
                recentOrders
            });

        } catch (error) {
            res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
        }
    }
};

module.exports = dashboardController;