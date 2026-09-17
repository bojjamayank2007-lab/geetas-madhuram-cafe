/**
 * models/Restaurant.js
 * Singleton — exactly ONE document holds the cafe's public profile.
 * Use Restaurant.getSingleton() to fetch-or-create it.
 */
const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "Geeta's Madhuram Cafe",
    },
    hindiName: {
      type: String,
      trim: true,
      default: "गीता'स मधुरम कैफे",
    },
    tagline: {
      type: String,
      trim: true,
      default: 'Good food. Good quantity. Good vibes.',
    },
    phone: { type: String, trim: true, default: '095619 79727' },
    whatsapp: { type: String, trim: true, default: '+91 95619 79727' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    address: {
      type: String,
      trim: true,
      default:
        'H No 157/2, Agra Road, beside Tirupati Hospital, Kaneri, Bhiwandi, Maharashtra 421302',
    },
    plusCode: { type: String, trim: true, default: '73R5+MC Bhiwandi, Maharashtra' },
    mapsQuery: { type: String, trim: true, default: "Geeta's Madhuram Cafe Bhiwandi" },
    mapEmbedUrl: {
      type: String,
      trim: true,
      default: 'https://www.google.com/maps?q=Geeta%27s+Madhuram+Cafe+Bhiwandi&output=embed',
    },
    swiggyUrl: {
      type: String,
      trim: true,
      default: 'https://www.swiggy.com/search?query=Geeta%27s%20Madhuram%20Cafe',
    },
    hours: {
      open: { type: String, trim: true, default: '7:00 AM' },
      close: { type: String, trim: true, default: '10:00 PM' },
      daysOpen: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    },
    rating: { type: Number, min: 0, max: 5, default: 4.6 },
    reviewCount: { type: Number, default: 16 },
    isAcceptingOrders: { type: Boolean, default: true },
    deliveryFee: { type: Number, min: 0, default: 20 },
    minOrder: { type: Number, min: 0, default: 99 },
  },
  { timestamps: true }
);

/**
 * Fetch the singleton restaurant document, creating it with defaults on first use.
 * @returns {Promise<import('mongoose').Document>}
 */
restaurantSchema.statics.getSingleton = async function () {
  const doc = await this.findOne().sort({ createdAt: 1 });
  if (doc) return doc;
  return this.create({});
};

module.exports = mongoose.model('Restaurant', restaurantSchema);