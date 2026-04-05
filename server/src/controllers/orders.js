const Order = require('../models/orders');
const { redisClient } = require('../config/redis');

const orderController = {

    async createOrder(req, res) {
        try {
            const { shippingAddressId, billingAddressId } = req.body;
            if (!shippingAddressId || !billingAddressId) {
                return res.status(400).json({ message: "Shipping and billing address IDs are required." });
            }

            const cacheKey = `orders:user:${req.user.id}`;
            await redisClient.del(cacheKey);

            const result = await Order.createFromCart(req.user.id, { shippingAddressId, billingAddressId });
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ message: error.message || "Error creating order" });
        }
    },

    async getUserOrders(req, res) {
        try {
            const userId = req.user.id;

            const cacheKey = `orders:user:${userId}`;
            const cachedOrders = await redisClient.get(cacheKey);
            if (cachedOrders) {
                return res.status(200).json(JSON.parse(cachedOrders));
            }

            const orders = await Order.findByUserId(userId);

            await redisClient.set(cacheKey, JSON.stringify(orders));

            res.status(200).json(orders);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving orders", error: error.message });
        }
    },

    async getProviderOrderItems(req, res) {
        try {
            const providerId = req.user.id;
            const items = await Order.findItemsByProviderId(providerId);
            res.status(200).json(items);
        } catch (error) {
            res.status(500).json({ message: "Error retrieving provider orders", error: error.message });
        }
    },

    async updateOrderItemStatus(req, res) {
        try {
            const { orderItemId } = req.params;
            const { status } = req.body;
            const user = req.user;

            const allowedStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
            if (!status || !allowedStatuses.includes(status)) {
                return res.status(400).json({ message: "Invalid status provided." });
            }

            const orderToUpdate = await Order.ItemModel.findByPk(orderItemId, { attributes: ['orderId'] });
            if (orderToUpdate) {
                const userToUpdate = await Order.Model.findByPk(orderToUpdate.orderId, { attributes: ['userId'] });

                if (userToUpdate) {
                    const cacheKey = `orders:user:${userToUpdate.userId}`;
                    await redisClient.del(cacheKey);
                }
            }

            await Order.updateItemStatus(orderItemId, user, status);
            res.status(200).json({ message: `Order item status updated to ${status}` });
        } catch (error) {
            if (error.message.includes("not found or you are not authorized")) {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: "Error updating order item status", error: error.message });
        }
    },

    async getAllOrders(req, res) {
        try {
            const { page = 1, sort = 'createdAt-desc', q = '' } = req.query;
            const limit = 20;
            const offset = (page - 1) * limit;
            let [sortBy, sortOrder] = sort.split('-');

            if (!['id', 'createdAt', 'totalAmount'].includes(sortBy)) {
                sortBy = 'createdAt';
            }
            if (!['asc', 'desc'].includes(sortOrder)) {
                sortOrder = 'desc';
            }

            const { rows: orders, count: totalOrders } = await Order.findAll({
                limit, offset, sortBy, sortOrder, searchTerm: q
            });

            res.status(200).json({
                orders,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalOrders / limit),
                    totalItems: totalOrders
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Error retrieving all orders", error: error.message });
        }
    },

    async deleteOrder(req, res) {
        try {
            const { orderId } = req.params;

            const orderToUpdate = await Order.Model.findByPk(orderId, { attributes: ['userId'] });
            if (orderToUpdate) {
                const cacheKey = `orders:user:${orderToUpdate.userId}`;
                await redisClient.del(cacheKey);
            }

            await Order.deleteById(Number(orderId));
            res.status(200).json({ message: 'Order deleted successfully.' });
        } catch (error) {
            res.status(500).json({ message: error.message || 'Error deleting order' });
        }
    }
};

module.exports = orderController;