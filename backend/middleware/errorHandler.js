/**
 * middleware/errorHandler.js
 * Central 404 + error middleware for the Express app.
 */
const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not Found - ${req.originalUrl}`));
};

/* eslint-disable no-unused-vars */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Server Error';

  /* Mongoose: bad ObjectId */
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${err.path}`;
  }

  /* Mongoose: duplicate unique key (e.g. phone, username) */
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `${field} is already in use`;
  }

  /* Mongoose: schema validation errors */
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  /* JSON body parse errors */
  if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON payload';
  }

  if (statusCode >= 500) console.error('✗ Server error:', err);

  res.status(statusCode).json({ success: false, message });
};

module.exports = { notFound, errorHandler };