const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const authMiddleware = require('../middleware/auth');
const checkRole = require('../middleware/role');
const { loginUser } = require('../config/keycloak');

router.use(authMiddleware, loginUser);

// GET /api/users - Get all users
router.get('/', checkRole(['admin']), userController.getAllUsers);

// PATCH /api/users/:userId - Update a user
router.patch('/:userId', checkRole(['admin']), userController.updateUserByAdmin);

// DELETE /api/users/:userId - Delete a user
router.delete('/:userId', checkRole(['admin']), userController.deleteUserByAdmin);

module.exports = router;