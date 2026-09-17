/**
 * models/Customer.js
 * Customer account — email is the unique login identifier.
 * Session lives in an HttpOnly cookie ("customerToken").
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number starting with 6-9'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    address: {
      line: { type: String, trim: true, default: '', maxlength: 120 },
      area: { type: String, trim: true, default: '', maxlength: 120 },
      landmark: { type: String, trim: true, default: '', maxlength: 120 },
      city: { type: String, trim: true, default: 'Bhiwandi', maxlength: 60 },
      state: { type: String, trim: true, default: 'Maharashtra', maxlength: 60 },
      pincode: {
        type: String,
        trim: true,
        default: '',
        match: [/^\d{6}$/, 'Pincode must be a 6-digit number'],
      },
    },
  },
  { timestamps: true }
);

/* Hash the password before saving */
customerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/* Compare a plain-text password against the stored hash */
customerSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/* Sanitised public view — never leak password fields */
customerSchema.methods.toPublic = function () {
  const { _id, name, email, phone, address, createdAt } = this;
  return { _id, name, email, phone, address, createdAt };
};

module.exports = mongoose.model('Customer', customerSchema);