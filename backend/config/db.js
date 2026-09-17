/**
 * config/db.js
 * MongoDB connection helper (Mongoose 8).
 * Reads MONGO_URI from the environment (loaded via dotenv in server.js).
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✓ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`✗ MongoDB connection failed: ${error.message}`);
    // In production, crash so the host restarts the process.
    process.exit(1);
  }
};

module.exports = connectDB;