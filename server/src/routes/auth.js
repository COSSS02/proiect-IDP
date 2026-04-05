const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const authMiddleware = require('../middleware/auth');
const { loginUser } = require('../config/keycloak');

// GET /api/auth/token - Get user token
router.get('/token', authMiddleware, loginUser, authController.getUserToken);

// PUT /api/auth/upgrade-to-provider - Upgrade user role
router.put('/upgrade-to-provider', authMiddleware, loginUser, authController.upgradeToProvider);

module.exports = router;