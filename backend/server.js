/**
 * server.js — Geeta's Madhuram Cafe API entry point.
 *
 * Express 4 + MongoDB. JWT auth is cookie-based (HttpOnly cookies).
 * Middleware order matters: security → body parsing → rate limits → routes →
 * 404 → central error handler.
 */
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

/* ─── Global middleware ──────────────────────────────────────────────────── */

// Security headers
app.use(helmet());

// Parse cookies (JWT lives in customerToken / adminToken)
app.use(cookieParser());

// Parse JSON bodies — 10kb is plenty for order payloads
app.use(express.json({ limit: '10kb' }));

// CORS — only explicitly allowed origins may call the API with credentials.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Explicit origin gate (browser requests always send an Origin header)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  // Non-browser clients (curl, Postman) and same-origin requests pass through
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Not allowed by CORS' });
});

// Emit CORS headers + credentials for the (now validated) origin
app.use(cors({ origin: true, credentials: true }));

/* ─── Rate limiting (security rule) ──────────────────────────────────────── */
// General API: 300 req / 15 min. A tighter 20 req / 15 min limit is applied
// on /api/auth and /api/admin/login inside their route files.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true, // Return RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
  message: { success: false, message: 'Too many requests — please try again later.' },
});
app.use('/api', generalLimiter);

/* ─── Public health probe ────────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: "Geeta's Madhuram Cafe API",
    version: '2.0.0',
    time: new Date().toISOString(),
  });
});

/* ─── API routes ─────────────────────────────────────────────────────────── */
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/restaurant', require('./routes/restaurant'));
app.use('/api/admin', require('./routes/admin'));

/* ─── Errors (must be last) ──────────────────────────────────────────────── */
app.use(notFound);
app.use(errorHandler);

/* ─── Boot ───────────────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      console.log(`✓ Geeta's Madhuram Cafe API running on http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
    });

    /* Clean shutdown on Ctrl+C / SIGTERM */
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal} — shutting down gracefully…`);
      server.close(async () => {
        try {
          await mongoose.connection.close();
          console.log('✓ MongoDB connection closed. Bye!');
          process.exit(0);
        } catch (error) {
          console.error('✗ Error during shutdown:', error.message);
          process.exit(1);
        }
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error(`✗ Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

start();