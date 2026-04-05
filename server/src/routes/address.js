const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { loginUser } = require('../config/keycloak');

router.use(authMiddleware, loginUser);

// POST /api/addresses - Create a new address for the logged-in user
router.post('/', addressController.createAddress);

// GET /api/addresses - Get all addresses for the logged-in user
router.get('/', addressController.getMyAddresses);

// Admin routes
router.get('/all', checkRole(['admin']), addressController.getAllAddresses);
router.patch('/:addressId', checkRole(['admin']), addressController.updateAddress);
router.delete('/:addressId', checkRole(['admin']), addressController.deleteAddress);

module.exports = router;