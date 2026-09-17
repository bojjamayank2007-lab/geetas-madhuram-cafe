/**
 * routes/auth.js
 * Customer auth routes.
 * Stricter rate limit: 20 requests / 15 minutes (security rule).
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  register,
  login,
  logout,
  me,
  updateAddress,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts — please try again in a few minutes.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, me);
router.put('/address', protect, updateAddress);

module.exports = router;
/* Shared with routes/admin.js for its login route */
module.exports.authLimiter = authLimiter;