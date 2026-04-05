const express = require('express');
const router = express.Router();
const wishlistController = require('../controllers/wishlist');
const authMiddleware = require('../middleware/auth');
const { loginUser } = require('../config/keycloak');

router.use(authMiddleware, loginUser);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.addToWishlist);
router.delete('/:productId', wishlistController.removeFromWishlist);

module.exports = router;