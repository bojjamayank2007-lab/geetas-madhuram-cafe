/**
 * seedAdmin.js — Geeta's Madhuram Cafe
 * ---------------------------------------------------------------------------
 * Creates the admin dashboard account from ADMIN_USERNAME / ADMIN_PASSWORD.
 *
 * IDEMPOTENT — if an admin with that username already exists it is left
 * untouched (the password is NEVER overwritten).
 * Run with: npm run seed:admin
 */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

const run = async () => {
  let exitCode = 0;

  try {
    await connectDB();

    const username = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
    const isDefaultPassword = password === 'ChangeMe123!';

    const existing = await Admin.findOne({ username });
    if (existing) {
      console.log(`ℹ️  Admin "${username}" already exists — skipping (password NOT changed).`);
    } else {
      await Admin.create({
        username,
        password,
        name: 'Owner',
        role: 'owner',
      });
      console.log(`✅ Created admin: "${username}" (name: Owner, role: owner)`);
    }

    console.warn(
      isDefaultPassword
        ? '⚠️  IMPORTANT: admin is using the DEFAULT password "ChangeMe123!". Set a strong ADMIN_PASSWORD in .env and change it after first login!'
        : `ℹ️  Admin password is set from the environment (not the default).`
    );
  } catch (error) {
    exitCode = 1;
    console.error('✗ Creating admin failed:', error.message);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('✓ Database connection closed');
    } catch (closeError) {
      console.error('✗ Error while closing the connection:', closeError.message);
    }
    process.exit(exitCode);
  }
};

run();