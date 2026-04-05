const express = require('express');
const router = express.Router();
const attributeController = require('../controllers/attribute');
const authMiddleware = require('../middleware/auth');
const { loginUser } = require('../config/keycloak');

router.get('/category/:categoryId', authMiddleware, loginUser, attributeController.getAttributesByCategory);

module.exports = router;