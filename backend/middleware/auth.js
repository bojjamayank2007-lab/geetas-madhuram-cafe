/**
 * middleware/auth.js
 * JWT authentication for customers and admins.
 *
 * SECURITY RULES
 *  - JWTs are stored ONLY in HttpOnly cookies (customerToken / adminToken),
 *    never in localStorage.
 *  - A request presenting the WRONG principal's cookie (e.g. a customer token
 *    hitting an admin route) receives 403, not 401.
 */
const jwt = require('jsonwebtoken');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');

/* ─── Cookie helpers ─────────────────────────────────────────────────────── */

const cookieOptions = {
  httpOnly: true, // JavaScript in the browser cannot read the token
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT_EXPIRES_IN
  path: '/',
};

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const setCustomerCookie = (res, token) => res.cookie('customerToken', token, cookieOptions);
const setAdminCookie = (res, token) => res.cookie('adminToken', token, cookieOptions);
const clearCustomerCookie = (res) => res.clearCookie('customerToken', cookieOptions);
const clearAdminCookie = (res) => res.clearCookie('adminToken', cookieOptions);

/* ─── Customer auth middleware ───────────────────────────────────────────── */

/**
 * Requires a valid customer JWT in the customerToken cookie.
 * Attaches the sanitised customer document to req.customer.
 * If the cookie is absent but a valid ADMIN token is present → 403.
 */
const protect = async (req, res, next) => {
  const token = req.cookies.customerToken;
  if (!token) {
    if (await hasValidToken(req.cookies.adminToken, Admin)) {
      res.status(403);
      return next(new Error('Access denied — this endpoint is for customers'));
    }
    res.status(401);
    return next(new Error('Not authorized — please login first'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findById(decoded.id).select('-password');
    if (!customer) {
      res.status(401);
      return next(new Error('Not authorized — account not found'));
    }
    req.customer = customer;
    next();
  } catch (error) {
    res.status(401);
    next(new Error('Not authorized — session expired or invalid'));
  }
};

/**
 * Optional customer auth — attaches req.customer when a valid customerToken
 * cookie exists; otherwise silently continues (used by public POST /reviews).
 */
const optionalAuth = async (req, res, next) => {
  const token = req.cookies.customerToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const customer = await Customer.findById(decoded.id).select('-password');
      if (customer) req.customer = customer;
    } catch (error) {
      /* Invalid/expired token — treat as anonymous */
    }
  }
  next();
};

/* ─── Admin auth middleware ──────────────────────────────────────────────── */

/**
 * Role check shared by adminProtect/adminOnly.
 * Requires a valid admin JWT in the adminToken cookie AND a role of admin/owner.
 * If the cookie is absent but a valid CUSTOMER token is present → 403.
 */
const adminProtect = async (req, res, next) => {
  const token = req.cookies.adminToken;
  if (!token) {
    if (await hasValidToken(req.cookies.customerToken, Customer)) {
      res.status(403);
      return next(new Error('Access denied — admins only'));
    }
    res.status(401);
    return next(new Error('Not authorized — admin login required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      res.status(401);
      return next(new Error('Not authorized — admin account not found'));
    }
    if (!['admin', 'owner'].includes(admin.role)) {
      res.status(403);
      return next(new Error('Access denied — insufficient privileges'));
    }
    req.admin = admin;
    next();
  } catch (error) {
    res.status(401);
    next(new Error('Not authorized — session expired or invalid'));
  }
};

/** Explicit alias with the same behaviour (role gate admin/owner). */
const adminOnly = adminProtect;

/* ─── Shared helper ──────────────────────────────────────────────────────── */

/** Returns true when the token is a valid JWT for the given Model. */
const hasValidToken = async (token, Model) => {
  if (!token) return false;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return Boolean(await Model.findById(decoded.id).select('_id'));
  } catch (error) {
    return false;
  }
};

module.exports = {
  protect,
  optionalAuth,
  adminProtect,
  adminOnly,
  signToken,
  setCustomerCookie,
  setAdminCookie,
  clearCustomerCookie,
  clearAdminCookie,
};