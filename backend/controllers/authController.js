/**
 * controllers/authController.js
 * Customer authentication + profile.
 * Sessions use the HttpOnly cookie "customerToken" (never localStorage).
 */
const Customer = require('../models/Customer');
const { signToken, setCustomerCookie, clearCustomerCookie } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip everything sensitive before sending a customer over the wire. */
const toPublic = (customer) => ({
  _id: customer._id,
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  address: customer.address,
  createdAt: customer.createdAt,
});

/**
 * POST /api/auth/register
 * { name, email, password, phone? } → 201 + customerToken cookie
 */
const register = async (req, res, next) => {
  try {
    const name = String((req.body && req.body.name) || '').trim();
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const phone = String((req.body && req.body.phone) || '').trim();
    const password = String((req.body && req.body.password) || '');

    if (name.length < 2) {
      res.status(400);
      return next(new Error('Please enter your name (min 2 characters)'));
    }
    if (!EMAIL_RE.test(email)) {
      res.status(400);
      return next(new Error('Enter a valid email address'));
    }
    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      res.status(400);
      return next(new Error('Enter a valid 10-digit Indian mobile number starting with 6-9'));
    }
    if (password.length < 6) {
      res.status(400);
      return next(new Error('Password must be at least 6 characters'));
    }

    const exists = await Customer.findOne({ email });
    if (exists) {
      res.status(409);
      return next(new Error('This email is already registered'));
    }

    const customer = await Customer.create({ name, email, ...(phone ? { phone } : {}), password });

    const token = signToken({ id: customer._id });
    setCustomerCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Account created — welcome to Geeta’s Madhuram Cafe!',
      data: toPublic(customer),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * { email, password } → 200 + customerToken cookie
 */
const login = async (req, res, next) => {
  try {
    const email = String((req.body && req.body.email) || '').trim().toLowerCase();
    const password = String((req.body && req.body.password) || '');

    if (!email || !password) {
      res.status(400);
      return next(new Error('Email and password are required'));
    }
    if (!EMAIL_RE.test(email)) {
      res.status(400);
      return next(new Error('Enter a valid email address'));
    }

    const customer = await Customer.findOne({ email }).select('+password');
    if (!customer || !(await customer.matchPassword(password))) {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }

    const token = signToken({ id: customer._id });
    setCustomerCookie(res, token);

    res.json({ success: true, message: 'Logged in successfully', data: toPublic(customer) });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout — clears the customerToken cookie.
 */
const logout = (req, res) => {
  clearCustomerCookie(res);
  res.json({ success: true, message: 'Logged out' });
};

/**
 * GET /api/auth/me — guarded by protect, returns req.customer.
 */
const me = (req, res) => {
  res.json({ success: true, data: toPublic(req.customer) });
};

/**
 * PUT /api/auth/address
 * { line, area, landmark, city, state, pincode } — updates the saved address.
 */
const updateAddress = async (req, res, next) => {
  try {
    const { line, area, landmark, city, state, pincode } = req.body || {};

    const address = { ...(req.customer.address || {}) };
    if (line !== undefined) address.line = String(line).trim();
    if (area !== undefined) address.area = String(area).trim();
    if (landmark !== undefined) address.landmark = String(landmark).trim();
    if (city !== undefined) address.city = String(city).trim();
    if (state !== undefined) address.state = String(state).trim();
    if (pincode !== undefined) {
      const pincodeStr = String(pincode).trim();
      if (pincodeStr && !/^\d{6}$/.test(pincodeStr)) {
        res.status(400);
        return next(new Error('Pincode must be a 6-digit number'));
      }
      address.pincode = pincodeStr;
    }

    req.customer.address = address;
    await req.customer.save();

    res.json({ success: true, message: 'Address updated', data: toPublic(req.customer) });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, me, updateAddress };