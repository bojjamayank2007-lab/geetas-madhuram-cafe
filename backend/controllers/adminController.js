/**
 * controllers/adminController.js
 * Admin dashboard — login, orders, menu mgmt helpers, review moderation,
 * restaurant settings and stats. All protected handlers require role admin/owner.
 */
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Review = require('../models/Review');
const Admin = require('../models/Admin');
const Restaurant = require('../models/Restaurant');
const emailService = require('../utils/emailService');
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

    // Fire-and-forget status update email
    Order.findById(order._id).populate('customer', 'email').then((populated) => {
      const email = populated?.customer?.email;
      if (email) {
        return emailService.sendStatusUpdate(populated, email, status);
      }
    }).catch((err) => console.error('status update email failed:', err.message));

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
 * { ordersToday, completedToday, cancelledToday, revenueToday, onlineRevenueToday,
 *   codRevenueToday, counterRevenueToday, pendingOrders, avgRating, totalOrders,
 *   totalMenuItems, availableMenuItems }
 */
const stats = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const round = (value) => Math.round((value || 0) * 100) / 100;
    const notCancelled = { $ne: ['$status', 'cancelled'] };

    const [today, pendingOrders, avgResult, totalOrders, totalMenuItems, availableMenuItems] = await Promise.all([
      // One aggregation computes every "today" metric in a single round trip.
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        {
          $group: {
            _id: null,
            ordersToday: { $sum: 1 },
            completedToday: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
            cancelledToday: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
            revenue: { $sum: { $cond: [notCancelled, '$total', 0] } },
            online: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ['$paymentMethod', 'razorpay'] }, { $eq: ['$paymentStatus', 'paid'] }, notCancelled] },
                  '$total',
                  0,
                ],
              },
            },
            cod: { $sum: { $cond: [{ $and: [{ $eq: ['$paymentMethod', 'cod'] }, notCancelled] }, '$total', 0] } },
            counter: { $sum: { $cond: [{ $and: [{ $eq: ['$paymentMethod', 'pay_at_counter'] }, notCancelled] }, '$total', 0] } },
          },
        },
      ]),
      Order.countDocuments({ status: { $in: ['placed', 'confirmed'] } }),
      Review.aggregate([
        { $match: { isApproved: true } },
        { $group: { _id: null, avg: { $avg: '$rating' } } },
      ]),
      Order.countDocuments(),
      MenuItem.countDocuments(),
      MenuItem.countDocuments({ isAvailable: true }),
    ]);

    const row = today[0] || {};

    res.json({
      success: true,
      data: {
        ordersToday: row.ordersToday || 0,
        completedToday: row.completedToday || 0,
        cancelledToday: row.cancelledToday || 0,
        revenueToday: round(row.revenue),
        onlineRevenueToday: round(row.online),
        codRevenueToday: round(row.cod),
        counterRevenueToday: round(row.counter),
        pendingOrders,
        avgRating: avgResult[0] ? Math.round(avgResult[0].avg * 10) / 10 : 0,
        totalOrders,
        totalMenuItems,
        availableMenuItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/stats/popular-items
 * Top N menu items by total quantity sold (all-time), excluding cancelled orders.
 */
const popularItems = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 5, 1), 20);

    const rows = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItem',
          name: { $first: '$items.name' },
          quantitySold: { $sum: '$items.quantity' },
          revenue: { $sum: '$items.amount' },
        },
      },
      { $sort: { quantitySold: -1, revenue: -1 } },
      { $limit: limit },
    ]);

    res.json({ success: true, data: rows });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/orders/:id
 * Permanently removes an order. Intended for cleanup of test/erroneous data.
 */
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }
    res.json({ success: true, message: `Order ${order.orderNumber} deleted` });
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
  popularItems,
  deleteOrder,
};