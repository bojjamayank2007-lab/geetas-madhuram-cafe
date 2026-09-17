/**
 * controllers/restaurantController.js
 * Public cafe profile (auto-created singleton).
 */
const Restaurant = require('../models/Restaurant');

/**
 * GET /api/restaurant — returns the single Restaurant profile document,
 * creating it with sensible defaults if it does not exist yet.
 */
const get = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.getSingleton();
    res.json({ success: true, data: restaurant });
  } catch (error) {
    next(error);
  }
};

module.exports = { get };