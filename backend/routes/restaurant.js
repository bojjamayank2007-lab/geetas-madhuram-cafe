/**
 * routes/restaurant.js
 * Public restaurant profile route.
 */
const express = require('express');
const router = express.Router();

const { get } = require('../controllers/restaurantController');

router.get('/', get);

module.exports = router;