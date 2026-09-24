/**
 * models/Order.js
 * A customer order. Prices are snapshotted server-side from the MenuItem
 * collection at creation time — the client is never trusted with prices.
 */
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      index: true,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: true,
        },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1, max: 50 },
        amount: { type: Number, required: true, min: 0 }, // price x quantity
      },
    ],
    orderType: {
      type: String,
      required: true,
      enum: {
        values: ['delivery', 'pickup', 'dinein'],
        message: '{VALUE} is not a valid order type',
      },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number starting with 6-9'],
    },
    customerAddress: {
      line: { type: String, trim: true, default: '' },
      area: { type: String, trim: true, default: '' },
      landmark: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: 'Bhiwandi' },
      state: { type: String, trim: true, default: 'Maharashtra' },
      pincode: { type: String, trim: true, default: '' },
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      required: true,
      enum: { values: ['cod', 'razorpay', 'pay_at_counter'], message: '{VALUE} is not a valid payment method' },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpay: {
      orderId: { type: String, trim: true, default: '' },
      paymentId: { type: String, trim: true, default: '' },
      signature: { type: String, trim: true, default: '' },
    },
    status: {
      type: String,
      enum: {
        values: [
          'placed',
          'confirmed',
          'preparing',
          'ready',
          'out-for-delivery',
          'delivered',
          'cancelled',
        ],
        message: '{VALUE} is not a valid order status',
      },
      default: 'placed',
      index: true,
    },
    /* Audit trail — every status change is recorded here (see adminController) */
    statusHistory: [
      {
        status: { type: String, required: true },
        note: { type: String, trim: true, default: '' },
        at: { type: Date, default: Date.now },
      },
    ],
    notes: { type: String, trim: true, maxlength: 300, default: '' },
  },
  { timestamps: true }
);

/* Number of managed order statuses (kept in sync with the enum above) */
orderSchema.statics.STATUSES = [
  'placed',
  'confirmed',
  'preparing',
  'ready',
  'out-for-delivery',
  'delivered',
  'cancelled',
];

module.exports = mongoose.model('Order', orderSchema);