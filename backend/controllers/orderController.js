/**
 * controllers/orderController.js
 * Customer order lifecycle: COD creation + Razorpay order/verify flow.
 *
 * SECURITY — prices are NEVER accepted from the client. Every item, price and
 * amount is re-read from the MenuItem collection server-side.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');

const OrderStatus = Order.STATUSES;

/** Local error carrying an HTTP status code. */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

const PHONE_RE = /^[6-9]\d{9}$/;

/** Friendly, unique order number, e.g. GMC-20260918-XY12AB */
const generateOrderNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `GMC-${date}-${suffix}`;
};

/**
 * Validate the cart and recalculate every price from the database.
 * Returns a fully-formed order payload (no payment fields).
 */
const buildOrderPayload = async (req) => {
  const restaurant = await Restaurant.getSingleton();

  // Rule: reject when the cafe is not accepting orders
  if (!restaurant.isAcceptingOrders) {
    throw new ApiError(400, 'We are not accepting orders right now. Please try again later.');
  }

  const body = req.body || {};
  const items = Array.isArray(body.items) ? body.items : [];
  const { orderType } = body;

  // Rule: reject empty carts
  if (items.length === 0) {
    throw new ApiError(400, 'Your cart is empty — add some dishes first');
  }
  if (!['delivery', 'pickup', 'dinein'].includes(orderType)) {
    throw new ApiError(400, 'Invalid order type. Choose delivery, pickup or dinein');
  }

  const menuIds = items.map((it) => it && it.menuItem);
  if (menuIds.some((id) => !id) || menuIds.length !== items.length) {
    throw new ApiError(400, 'Every cart item needs a valid menuItem id and quantity');
  }

  // Re-read items from the DB (available only)
  const dbItems = await MenuItem.find({ _id: { $in: menuIds }, isAvailable: true });
  const uniqueIds = new Set(menuIds.map((id) => String(id)));
  if (dbItems.length !== uniqueIds.size) {
    throw new ApiError(400, 'Some items in your cart are unavailable right now');
  }

  const dbMap = new Map(dbItems.map((m) => [String(m._id), m]));

  const orderItems = items.map(({ menuItem, quantity }) => {
    const item = dbMap.get(String(menuItem));
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
      throw new ApiError(400, 'Invalid quantity — must be a whole number between 1 and 50');
    }
    return {
      menuItem: item._id,
      name: item.name,
      price: item.price,
      quantity: qty,
      amount: item.price * qty, // server-side price only
    };
  });

  const subtotal = orderItems.reduce((sum, i) => sum + i.amount, 0);
  if (subtotal <= 0) {
    throw new ApiError(400, 'Cart total must be greater than zero');
  }
  const minOrder = Number(restaurant.minOrder || 0);
  if (minOrder > 0 && subtotal < minOrder) {
    throw new ApiError(400, `Minimum order is ₹${minOrder}. Please add more items.`);
  }

  // Delivery fee applies to delivery orders only
  const deliveryFee = orderType === 'delivery' ? Number(restaurant.deliveryFee || 0) : 0;
  const total = subtotal + deliveryFee;

  // Phone belongs to this order; customer accounts may omit it.
  const phone = String(body.phone || '').trim();
  if (!PHONE_RE.test(phone)) {
    throw new ApiError(400, 'A valid phone number is required to place an order');
  }

  let customerAddress = {};
  if (orderType === 'delivery') {
    const src = body.customerAddress || req.customer.address || {};
    const line = String(src.line || '').trim();
    const pincode = String(src.pincode || '').trim();
    if (!line) throw new ApiError(400, 'Delivery address line is required');
    if (!/^\d{6}$/.test(pincode)) throw new ApiError(400, 'A valid 6-digit pincode is required for delivery');
    customerAddress = {
      line,
      area: String(src.area || '').trim(),
      landmark: String(src.landmark || '').trim(),
      city: String(src.city || '').trim() || 'Bhiwandi',
      state: String(src.state || '').trim() || 'Maharashtra',
      pincode,
    };
  }

  return {
    customer: req.customer._id,
    items: orderItems,
    subtotal,
    deliveryFee,
    discount: 0,
    total,
    orderType,
    phone,
    customerAddress,
    notes: String(body.notes || '').trim().slice(0, 300),
    orderNumber: generateOrderNumber(),
  };
};

/* ─── Routes ─────────────────────────────────────────────────────────────── */

/** Map any ApiError into a normalised Express error response. */
const handleError = (error, res, next) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode);
    return next(new Error(error.message));
  }
  next(error);
};

/**
 * POST /api/orders — default COD flow.
 */
const create = async (req, res, next) => {
  try {
    const payload = await buildOrderPayload(req);
    const order = await Order.create({
      ...payload,
      paymentMethod: 'cod',
      paymentStatus: 'pending',
      statusHistory: [{ status: 'placed', note: 'Order placed' }],
    });
    res.status(201).json({ success: true, message: `Order ${order.orderNumber} placed!`, data: order });
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * GET /api/orders/my — the logged-in customer's orders, newest first.
 */
const getMy = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.customer._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id — own order only (else 403/404).
 */
const getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Accept either a MongoDB ObjectId OR a human-readable order number (GMC-...)
    const query = mongoose.isValidObjectId(id)
      ? { _id: id }
      : { orderNumber: String(id).toUpperCase() };

    const order = await Order.findOne(query).populate('customer', 'name phone');
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }
    if (String(order.customer._id) !== String(req.customer._id)) {
      res.status(403);
      return next(new Error('Access denied — this order belongs to another account'));
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/razorpay/create
 * Validates the cart, creates a Razorpay order and a pending Order document.
 * Returns 503 when Razorpay credentials are not configured (COD is the default).
 */
const razorpayCreate = async (req, res, next) => {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      res.status(503);
      return next(new Error('Razorpay is not configured — please use Cash on Delivery'));
    }

    const payload = await buildOrderPayload(req);
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(payload.total * 100), // paise
      currency: 'INR',
      receipt: payload.orderNumber,
    });

    const order = await Order.create({
      ...payload,
      paymentMethod: 'razorpay',
      paymentStatus: 'pending',
      razorpay: { orderId: rzpOrder.id },
      statusHistory: [{ status: 'placed', note: 'Order placed (Razorpay pending)' }],
    });

    res.status(201).json({
      success: true,
      data: {
        orderId: rzpOrder.id,
        key_id: keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        order: order._id,
        orderNumber: order.orderNumber,
      },
    });
  } catch (error) {
    handleError(error, res, next);
  }
};

/**
 * POST /api/orders/razorpay/verify
 * { order, paymentId, signature } — verifies the HMAC signature server-side
 * and marks the order as paid. Returns 503 when Razorpay is not configured.
 */
const razorpayVerify = async (req, res, next) => {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!process.env.RAZORPAY_KEY_ID || !keySecret) {
      res.status(503);
      return next(new Error('Razorpay is not configured — please use Cash on Delivery'));
    }

    const { order: orderId, paymentId, signature } = req.body || {};
    if (!orderId || !paymentId || !signature) {
      res.status(400);
      return next(new Error('order, paymentId and signature are required'));
    }

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      return next(new Error('Order not found'));
    }
    if (String(order.customer._id) !== String(req.customer._id)) {
      res.status(403);
      return next(new Error('Access denied — this order belongs to another account'));
    }

    // Server-side signature verification (Razorpay spec)
    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${order.razorpay.orderId}|${paymentId}`)
      .digest('hex');

    if (expected !== signature) {
      res.status(400);
      return next(new Error('Invalid payment signature — payment could not be verified'));
    }

    order.paymentStatus = 'paid';
    order.razorpay.paymentId = paymentId;
    order.razorpay.signature = signature;
    await order.save();

    res.json({ success: true, message: 'Payment verified', data: order });
  } catch (error) {
    handleError(error, res, next);
  }
};

module.exports = { create, getMy, getOne, razorpayCreate, razorpayVerify, OrderStatus };
module.exports.ApiError = ApiError;