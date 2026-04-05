const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { loginUser } = require('../config/keycloak');

router.get('/admin', authMiddleware, loginUser, checkRole(['admin']), dashboardController.getAdminDashboard);
router.get('/provider', authMiddleware, loginUser, checkRole(['provider']), dashboardController.getProviderDashboard);

module.exports = router;