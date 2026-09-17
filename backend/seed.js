/**
 * seed.js — Geeta's Madhuram Cafe
 * ---------------------------------------------------------------------------
 * Wipes the MenuItem / Restaurant / Review collections, then inserts:
 *   • 28 South Indian menu items (Dosa 6, Pesarattu 9, Uttapam 6, Snacks 4, Poori 3)
 *   • the Restaurant singleton profile
 *   • 3 approved, featured customer reviews
 *
 * IDEMPOTENT — running it twice produces the exact same final state
 * (it wipes first). Run with: npm run seed
 */
require('dotenv').config();

// Development note: before testing email auth, clear legacy phone-keyed users with:
// db.customers.deleteMany({})

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const MenuItem = require('./models/MenuItem');
const Restaurant = require('./models/Restaurant');
const Review = require('./models/Review');

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/** Unsplash URL builder (spec format: w=800, q=80, cropped). */
const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

const IMG = {
  dosa: 'photo-1630383249896-424e482df921',
  pesarattu: 'photo-1601050690597-df0568f70950',
  uttapam: 'photo-1546833999-b9f581a1996d',
  snacks: 'photo-1606491956689-2ea866880c84',
  poori: 'photo-1585937421612-70a008356fbe',
};

/* ─── Seed data: menu ───────────────────────────────────────────────────── */

const MENU_ITEMS = [
  { name: 'Plain Dosa', description: 'Crisp golden dosa served with sambar & chutney', price: 90, category: 'dosa', image: img(IMG.dosa), isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 1, tags: ['classic'] },
  { name: 'Podi Dosa', description: 'Dosa smeared with spicy gunpowder podi', price: 100, category: 'dosa', image: img(IMG.dosa), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 2, tags: ['podi'] },
  { name: 'Podi Masala Dosa', description: 'Podi dosa with spiced potato filling', price: 120, category: 'dosa', image: img(IMG.dosa), isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 3, tags: ['podi', 'masala'] },
  { name: 'Cheese Podi Masala Dosa', description: 'Cheese, podi and masala — fully loaded', price: 130, category: 'dosa', image: img(IMG.dosa), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 4, tags: ['cheese', 'podi'] },
  { name: 'Cheese Plain Dosa', description: 'Classic dosa with melted cheese', price: 120, category: 'dosa', image: img(IMG.dosa), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 5, tags: ['cheese'] },
  { name: 'Cheese Podi Dosa', description: 'Cheese dosa with a spicy podi kick', price: 130, category: 'dosa', image: img(IMG.dosa), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 6, tags: ['cheese', 'podi'] },
  { name: 'Plain Pesarattu', description: 'Andhra-style green gram dosa, served with upma', price: 60, category: 'pesarattu', image: img(IMG.pesarattu), isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 10, tags: ['andhra'] },
  { name: 'Onion Pesarattu', description: 'Pesarattu topped with chopped onions', price: 60, category: 'pesarattu', image: img(IMG.pesarattu), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 11, tags: ['onion'] },
  { name: 'Upma Pesarattu', description: 'Pesarattu with a hearty upma filling', price: 70, category: 'pesarattu', image: img(IMG.pesarattu), isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 12, tags: ['upma'] },
  { name: 'Ghee Podi Pesarattu', description: 'Pesarattu with ghee and podi', price: 80, category: 'pesarattu', image: img(IMG.pesarattu), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 13, tags: ['ghee', 'podi'] },
  { name: 'Ghee Karam Pesarattu', description: 'Pesarattu with spicy karam podi', price: 80, category: 'pesarattu', image: img(IMG.pesarattu), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 14, tags: ['ghee', 'karam'] },
  { name: 'Cheese Pesarattu', description: 'Pesarattu with melted cheese', price: 90, category: 'pesarattu', image: img(IMG.pesarattu), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 15, tags: ['cheese'] },
  { name: 'Panner Pesarattu', description: 'Pesarattu stuffed with paneer', price: 100, category: 'pesarattu', image: img(IMG.pesarattu), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 16, tags: ['paneer'] },
  { name: 'Masala Pasarattu', description: 'Pesarattu with spiced potato masala', price: 70, category: 'pesarattu', image: img(IMG.pesarattu), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 17, tags: ['masala'] },
  { name: 'Butter Pasarattu', description: 'Pesarattu cooked in butter', price: 80, category: 'pesarattu', image: img(IMG.pesarattu), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 18, tags: ['butter'] },
  { name: 'Plain Uttapam', description: 'Soft, thick pancake with onions & green chilli', price: 60, category: 'uttapam', image: img(IMG.uttapam), isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 20, tags: ['classic'] },
  { name: 'Onion Uttapam', description: 'Topped with fresh onions', price: 70, category: 'uttapam', image: img(IMG.uttapam), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 21, tags: ['onion'] },
  { name: 'Butter Uttapam', description: 'Cooked with butter', price: 80, category: 'uttapam', image: img(IMG.uttapam), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 22, tags: ['butter'] },
  { name: 'Ghee Podi Uttapam', description: 'Uttapam with ghee and podi', price: 90, category: 'uttapam', image: img(IMG.uttapam), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 23, tags: ['ghee', 'podi'] },
  { name: 'Ghee Karam Uttapam', description: 'Uttapam with spicy karam', price: 90, category: 'uttapam', image: img(IMG.uttapam), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 24, tags: ['ghee', 'karam'] },
  { name: 'Panner Uttapam', description: 'Uttapam topped with paneer', price: 100, category: 'uttapam', image: img(IMG.uttapam), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 25, tags: ['paneer'] },
  { name: 'Sarvapindi (Sarvappa)', description: 'Traditional Telangana rice-flour snack with sesame & chana dal', price: 45, category: 'snacks', image: img(IMG.snacks), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 30, tags: ['telangana'] },
  { name: 'Paani Poori', description: 'Crispy puris with tangy pani (6 pcs)', price: 45, category: 'snacks', image: img(IMG.snacks), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 31, tags: ['street-food'] },
  { name: 'Poonugulu', description: 'Crispy fried lentil dumplings', price: 45, category: 'snacks', image: img(IMG.snacks), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 32, tags: ['fried'] },
  { name: 'Mirchi Bajji', description: 'Stuffed chilli fritters, hot & spicy', price: 45, category: 'snacks', image: img(IMG.snacks), isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 33, tags: ['spicy'] },
  { name: 'Poori (3 Pcs)', description: 'Three fluffy pooris', price: 45, category: 'poori', image: img(IMG.poori), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 40, tags: ['classic'] },
  { name: 'Poori Masala', description: 'Pooris served with spiced potato masala', price: 45, category: 'poori', image: img(IMG.poori), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 41, tags: ['masala'] },
  { name: 'Poori Kurma', description: 'Pooris with rich vegetable kurma', price: 45, category: 'poori', image: img(IMG.poori), isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 42, tags: ['kurma'] },
];

/* ─── Seed data: restaurant profile (singleton) ─────────────────────────── */

const RESTAURANT = {
  name: "Geeta's Madhuram Cafe",
  hindiName: "गीता'स मधुरम कैफे",
  tagline: 'Taste the South in Every Bite!',
  phone: '095619 79727',
  whatsapp: '919561979727',
  email: '',
  address:
    'H No 157/2, Agra Road, Beside Tirupati Hospital, Kaneri, Bhiwandi, Maharashtra 421302',
  plusCode: '73R5+MC Bhiwandi, Maharashtra',
  mapsQuery: "Geeta's Madhuram Cafe Bhiwandi",
  mapEmbedUrl: 'https://www.google.com/maps?q=Geeta%27s+Madhuram+Cafe+Bhiwandi&output=embed',
  swiggyUrl: 'https://www.swiggy.com/search?query=Geeta%27s%20Madhuram%20Cafe',
  hours: {
    open: '7:00 AM',
    close: '10:00 PM',
    daysOpen: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  },
  rating: 4.6,
  reviewCount: 16,
  isAcceptingOrders: true,
  deliveryFee: 20,
  minOrder: 100,
};

/* ─── Seed data: reviews (3 approved + featured) ────────────────────────── */

const REVIEWS = [
  {
    name: 'Aarav S.',
    rating: 5,
    message: 'Very very delicious food and staff behaviour very good 😊',
    isApproved: true,
    isFeatured: true,
    customer: null,
  },
  {
    name: 'Priya M.',
    rating: 5,
    message: 'Very Tasty, Good Quantity and quality.',
    isApproved: true,
    isFeatured: true,
    customer: null,
  },
  {
    name: 'Rohit K.',
    rating: 5,
    message: 'Great service and a wonderful dining experience.',
    isApproved: true,
    isFeatured: true,
    customer: null,
  },
];

/* ─── Runner ─────────────────────────────────────────────────────────────── */

const run = async () => {
  let exitCode = 0;

  try {
    await connectDB();

    console.log('🧹 Wiping MenuItem / Restaurant / Review collections…');
    await Promise.all([
      MenuItem.deleteMany({}),
      Restaurant.deleteMany({}),
      Review.deleteMany({}),
    ]);

    // Menu (28 items)
    await MenuItem.insertMany(MENU_ITEMS);
    const menuCount = await MenuItem.countDocuments();
    console.log(`✅ Inserted ${menuCount} menu items`);

    // Restaurant singleton
    const restaurant = await Restaurant.create(RESTAURANT);
    console.log(`✅ Inserted restaurant profile: ${restaurant.name} (${restaurant.rating}★)`);

    // Reviews (3 approved + featured)
    await Review.insertMany(REVIEWS);
    const reviewCount = await Review.countDocuments();
    console.log(`✅ Inserted ${reviewCount} approved reviews`);

    console.log(
      `🎉 Seeding complete → MenuItem: ${menuCount} | Restaurant: 1 | Review: ${reviewCount}`
    );
  } catch (error) {
    exitCode = 1;
    console.error('✗ Seeding failed:', error.message);
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