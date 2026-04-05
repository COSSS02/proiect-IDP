const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart');
const authMiddleware = require('../middleware/auth');
const { loginUser } = require('../config/keycloak');

router.use(authMiddleware, loginUser);

router.get('/', cartController.getCart);
router.post('/', cartController.addItem);
router.put('/:productId', cartController.updateItem);
router.delete('/:productId', cartController.removeItem);

module.exports = router;