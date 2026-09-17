/**
 * controllers/reviewController.js
 * Public reviews. Only approved reviews are ever served.
 */
const Review = require('../models/Review');

/**
 * GET /api/reviews — approved reviews only, newest first, max 20.
 */
const getAll = async (req, res, next) => {
  try {
    const reviews = await Review.find({ isApproved: true })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/reviews (optionalAuth — req.customer set when logged in)
 * { name, rating 1-5, message|text } → 201, isApproved: false (needs moderation).
 */
const create = async (req, res, next) => {
  try {
    const name = String((req.body && req.body.name) || '').trim();
    const message = String((req.body && req.body.message) || (req.body && req.body.text) || '').trim();
    const rating = Number(req.body && req.body.rating);

    if (name.length < 2) {
      res.status(400);
      return next(new Error('Please enter your name (min 2 characters)'));
    }
    if (!message) {
      res.status(400);
      return next(new Error('Please write a short review'));
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400);
      return next(new Error('Rating must be an integer between 1 and 5'));
    }

    const review = await Review.create({
      name,
      message,
      rating,
      customer: req.customer ? req.customer._id : null,
      isApproved: false,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review is awaiting approval.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create };