const express = require('express');
const router = express.Router();
const {
  login,
  getMe,
  registerUser,
  getAllUsers,
  toggleUserStatus,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/users', protect, adminOnly, registerUser);
router.get('/users', protect, adminOnly, getAllUsers);
router.patch('/users/:id/status', protect, adminOnly, toggleUserStatus);

module.exports = router;
