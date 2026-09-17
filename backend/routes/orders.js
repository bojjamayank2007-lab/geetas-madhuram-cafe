/**
 * routes/orders.js
 * Customer order routes — all protected by the customerToken cookie.
 * NOTE: "/my" is registered before "/:id" so it is not caught as an id param.
 */
const express = require('express');
const router = express.Router();

const {
  create,
  getMy,
  getOne,
  razorpayCreate,
  razorpayVerify,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.post('/', protect, create);
router.get('/my', protect, getMy);
router.post('/razorpay/create', protect, razorpayCreate);
router.post('/razorpay/verify', protect, razorpayVerify);
router.get('/:id', protect, getOne);

module.exports = router;