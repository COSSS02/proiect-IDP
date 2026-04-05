const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orders');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { loginUser } = require('../config/keycloak');

router.use(authMiddleware, loginUser);

// --- Client routes ---
router.post('/', orderController.createOrder);
router.get('/', orderController.getUserOrders);

// --- Provider routes ---
router.get('/provider', checkRole(['provider']), orderController.getProviderOrderItems);
router.patch('/items/:orderItemId', checkRole(['provider', 'admin']), orderController.updateOrderItemStatus);

// --- Admin routes ---
router.get('/all', checkRole(['admin']), orderController.getAllOrders);
router.delete('/:orderId', checkRole(['admin']), orderController.deleteOrder);

module.exports = router;