/**
 * routes/admin.js
 * Admin dashboard routes — everything except login/logout is behind adminProtect.
 * Stricter rate limit on /login (20 req / 15 min).
 */
const express = require('express');
const router = express.Router();

const {
  login,
  logout,
  me,
  listOrders,
  updateOrderStatus,
  listReviews,
  approveReview,
  deleteReview,
  updateRestaurant,
  stats,
} = require('../controllers/adminController');
const {
  adminGetAll,
  create: createMenuItem,
  update: updateMenuItem,
  remove: deleteMenuItem,
} = require('../controllers/menuController');
const { adminProtect } = require('../middleware/auth');
const { authLimiter } = require('./auth');

/* Auth */
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', adminProtect, me);

/* Orders */
router.get('/orders', adminProtect, listOrders);
router.patch('/orders/:id/status', adminProtect, updateOrderStatus);

/* Menu CRUD */
router.get('/menu', adminProtect, adminGetAll);
router.post('/menu', adminProtect, createMenuItem);
router.put('/menu/:id', adminProtect, updateMenuItem);
router.delete('/menu/:id', adminProtect, deleteMenuItem);

/* Reviews */
router.get('/reviews', adminProtect, listReviews);
router.patch('/reviews/:id/approve', adminProtect, approveReview);
router.delete('/reviews/:id', adminProtect, deleteReview);

/* Settings + stats */
router.put('/restaurant', adminProtect, updateRestaurant);
router.get('/stats', adminProtect, stats);

module.exports = router;