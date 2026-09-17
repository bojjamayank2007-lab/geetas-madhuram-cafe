/**
 * routes/reviews.js
 * Public review routes — GET returns approved only, POST needs moderation.
 */
const express = require('express');
const router = express.Router();

const { getAll, create } = require('../controllers/reviewController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', getAll);
router.post('/', optionalAuth, create);

module.exports = router;