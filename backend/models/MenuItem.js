/**
 * models/MenuItem.js
 * A single dish on the cafe menu.
 */
const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [80, 'Item name must be at most 80 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [300, 'Description must be at most 300 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['idli', 'dosa', 'benne_dosa', 'pesarattu', 'uttapam', 'wada', 'bonda', 'upma', 'snacks', 'poori'],
        message: '{VALUE} is not a valid category',
      },
      index: true,
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isPopular: {
      type: Boolean,
      default: false,
      index: true,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    /* 0 = mild, 3 = very spicy */
    spicyLevel: {
      type: Number,
      min: 0,
      max: 3,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/* Composite index for menu list queries */
menuItemSchema.index({ category: 1, sortOrder: 1 });

/* Please allow this model in queries but keep popular flag also indexed — done above. */

module.exports = mongoose.model('MenuItem', menuItemSchema);