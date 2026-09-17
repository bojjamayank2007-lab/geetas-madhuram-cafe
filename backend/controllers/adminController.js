/**
 * controllers/adminController.js
 * Admin dashboard — login, orders, menu mgmt helpers, review moderation,
 * restaurant settings and stats. All protected handlers require role admin/owner.
 */
const Order = require('../models/Order');
const Review = require('../models/Review');
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const { signToken, setAdminCookie, clearAdminCookie } = require('../middleware/auth');

const OrderStatus = Order.STATUSES;

/* Fields the admin dashboard may update on the Restaurant singleton */
const RESTAURANT_FIELDS = [
  'name',
  'hindiName',
  'tagline',
  'phone',
  'whatsapp',
  'email',
  'address',
  'plusCode',
  'mapsQuery',
  'mapEmbedUrl',
  'swiggyUrl',
  'rating',
  'reviewCount',
  'isAcceptingOrders',
  'deliveryFee',
  'minOrder',
];

/** Strip sensitive admin fields before sending over the wire. */
const toAdminPublic = (admin) => ({
  _id: admin._id,
  username: admin.username,
  name: admin.name,
  role: admin.role,
  createdAt: admin.createdAt,
});

/* ─── Authentication ────────────────────────────────────────────────────── */

/**
 * POST /api/admin/login — { username, password } → adminToken cookie.
 */
const login = async (req, res, next) => {
  try {
    const username = String((req.body && req.body.username) || '').trim().toLowerCase();
    const password = String((req.body && req.body.password) || '');

    if (!username || !password) {
      res.status(400);
      return next(new Error('Username and password are required'));
    }

    const admin = await Admin.findOne({ username }).select('+password');
    if (!admin || !(await admin.matchPassword(password))) {
      res.status(401);
      return next(new Error('Invalid username or password'));
    }

    const token = signToken({ id: admin._id });
    setAdminCookie(res, token);

    res.json({ success: true, message: 'Welcome back!', data: toAdminPublic(admin) });
  } catch (error) {
    next(error);
  }
};

/** POST /api/admin/logout — clears the adminToken cookie. */
const logout = (req, res) => {
  clearAdminCookie(res);
  res.json({ success: true, message: 'Logged out' });
};

/** GET /api/admin/me — guarded by adminProtect. */
const me = (req, res) => {
  res.json({ success: true, data: toAdminPublic(req.admin) });
};

/* ─── Orders ────────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/orders?status=&page=&limit=
 */
const listOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) {
      if (!OrderStatus.includes(req.query.status)) {
        res.status(400);
        return next(new Error('Invalid order status'));
      }
      filter.status = req.query.status;
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      data: orders,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/orders/:id/status — validate the enum and log to statusHistory.
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!OrderStatus.includes(status)) {
      res.status(400);
      return next(new Error('Invalid order status'));
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: String((req.body && req.body.note) || '').slice(0, 200),
    });
    await order.save();

    res.json({ success: true, message: `Order marked as "${status}"`, data: order });
  } catch (error) {
    next(error);
  }
};

/* ─── Reviews ───────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/reviews?approved=false — all reviews (filter by moderation state).
 */
const listReviews = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.approved === 'true') filter.isApproved = true;
    if (req.query.approved === 'false') filter.isApproved = false;

    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      data: reviews,
      meta: { pending: await Review.countDocuments({ isApproved: false }) },
    });
  } catch (error) {
    next(error);
  }
};

/** PATCH /api/admin/reviews/:id/approve */
const approveReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      res.status(404);
      return next(new Error('Review not found'));
    }
    review.isApproved = true;
    await review.save();
    res.json({ success: true, message: 'Review approved — it is now public', data: review });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/admin/reviews/:id */
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      res.status(404);
      return next(new Error('Review not found'));
    }
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

/* ─── Restaurant settings ───────────────────────────────────────────────── */

/**
 * PUT /api/admin/restaurant — update the singleton with whitelisted fields.
 */
const updateRestaurant = async (req, res, next) => {
  try {
    const body = req.body || {};
    const restaurant = await Restaurant.getSingleton();

    for (const field of RESTAURANT_FIELDS) {
      if (body[field] !== undefined) restaurant[field] = body[field];
    }
    // Nested hours: { hours: { open, close } }
    if (body.hours && typeof body.hours === 'object') {
      if (body.hours.open !== undefined) restaurant.hours.open = String(body.hours.open);
      if (body.hours.close !== undefined) restaurant.hours.close = String(body.hours.close);
    }

    await restaurant.save();
    res.json({ success: true, message: 'Restaurant settings updated', data: restaurant });
  } catch (error) {
    next(error);
  }
};

/* ─── Stats ─────────────────────────────────────────────────────────────── */

/**
 * GET /api/admin/stats
 * { ordersToday, revenueToday, pendingOrders, avgRating, totalOrders }
 */
const stats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [ordersToday, revenueResult, pendingOrders, avgResult, totalOrders] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: startOfToday } }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfToday },
            status: { $ne: 'cancelled' },
          },
        },
        { $group: { _id: null, revenue: { $sum: '$total' } } },
      ]),
      Order.countDocuments({ status: { $in: ['placed', 'confirmed'] } }),
      Review.aggregate([
        { $match: { isApproved: true } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),
      Order.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        ordersToday,
        revenueToday: Math.round((revenueResult[0] ? revenueResult[0].revenue : 0) * 100) / 100,
        pendingOrders,
        avgRating: avgResult[0] ? Math.round(avgResult[0].avg * 10) / 10 : 0,
        totalOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};