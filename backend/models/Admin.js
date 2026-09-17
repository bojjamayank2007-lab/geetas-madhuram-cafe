/**
 * models/Admin.js
 * Backend dashboard admin/owner account.
 * Credentials live in an HttpOnly cookie ("adminToken").
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username must be at most 30 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    name: {
      type: String,
      trim: true,
      default: 'Owner',
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    role: {
      type: String,
      enum: ['admin', 'owner'],
      default: 'owner',
    },
  },
  { timestamps: true }
);

/* Hash the password before saving */
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* Compare a plain-text password against the stored hash */
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);