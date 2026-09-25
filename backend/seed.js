/**
 * seed.js — Geeta's Madhuram Cafe
 * ---------------------------------------------------------------------------
 * Wipes the MenuItem / Restaurant / Review collections, then inserts:
 *   • 58 South Indian menu items across 10 categories
 *   • the Restaurant singleton profile
 *   • 3 approved, featured customer reviews
 *
 * IDEMPOTENT — running it twice produces the exact same final state
 * (it wipes first). Run with: npm run seed
 */

// NOTE: Menu images are LoremFlickr placeholders (free, no signup).
// Replace with real photos via the admin dashboard's Menu tab → Edit item →
// paste a new image URL. LoremFlickr keywords and locks are documented inline.

require('dotenv').config();

// Development note: before testing email auth, clear legacy phone-keyed users with:
// db.customers.deleteMany({})

const mongoose = require('mongoose');
const connectDB = require('./config/db');
const MenuItem = require('./models/MenuItem');
const Restaurant = require('./models/Restaurant');
const Review = require('./models/Review');

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/* LoremFlickr placeholder generator — replace with real photos later via
   the admin dashboard. The `lock` value keeps the same image cached per
   dish, so it doesn't shuffle on every request. */

/* ─── Seed data: menu ───────────────────────────────────────────────────── */

const MENU_ITEMS = [
  { name: 'Plain Dosa', description: 'Crisp golden dosa served with sambar & chutney', price: 45, category: 'dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 1, tags: ['classic'] },
  { name: 'Butter Dosa', description: 'Dosa cooked in butter', price: 50, category: 'dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 2, tags: ['butter'] },
  { name: 'Ghee Dosa', description: 'Dosa cooked in ghee', price: 60, category: 'dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 3, tags: ['ghee'] },
  { name: 'Masala Dosa', description: 'Dosa with spiced potato filling', price: 60, category: 'dosa', image: '/assets/menu/dosa-2.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 4, tags: ['masala'] },
  { name: 'Onion Dosa', description: 'Dosa topped with onions', price: 60, category: 'dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 5, tags: ['onion'] },
  { name: 'Butter Masala Dosa', description: 'Masala dosa with butter', price: 70, category: 'dosa', image: '/assets/menu/dosa-2.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 6, tags: ['butter', 'masala'] },
  { name: 'Ghee Karam Dosa', description: 'Dosa with ghee and spicy karam podi', price: 70, category: 'dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 7, tags: ['ghee', 'karam'] },
  { name: 'Ghee Podi Dosa', description: 'Dosa with ghee and podi', price: 70, category: 'dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 8, tags: ['ghee', 'podi'] },
  { name: 'Cheese Dosa', description: 'Dosa with melted cheese', price: 70, category: 'dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 9, tags: ['cheese'] },
  { name: 'Upma Dosa', description: 'Dosa with upma filling', price: 60, category: 'dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 10, tags: ['upma'] },
  { name: 'Sizwan Sada Dosa', description: 'Schezwan-style dosa', price: 60, category: 'dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 11, tags: ['schezwan'] },
  { name: 'Sizwan Masala Dosa', description: 'Schezwan masala dosa', price: 70, category: 'dosa', image: '/assets/menu/dosa-2.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 12, tags: ['schezwan', 'masala'] },
  { name: 'Sizwan Panner Masala Dosa', description: 'Schezwan paneer masala dosa', price: 80, category: 'dosa', image: '/assets/menu/dosa-2.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 13, tags: ['schezwan', 'paneer'] },
  { name: 'Sizwan Butter Panner Dosa', description: 'Schezwan paneer dosa with butter', price: 80, category: 'dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 14, tags: ['schezwan', 'butter'] },
  { name: 'Set Dosa', description: 'Soft, spongy set of 3 dosas', price: 70, category: 'dosa', image: '/assets/menu/dosa-3.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 15, tags: ['classic'] },
  { name: 'Plain Idli (3 Pcs)', description: 'Three soft steamed idlis with sambar & chutney', price: 45, category: 'idli', image: '/assets/menu/idli-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 20, tags: ['classic'] },
  { name: 'Thatte Idli', description: 'Large Karnataka-style flat idli', price: 60, category: 'idli', image: '/assets/menu/idli-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 21, tags: ['karnataka'] },
  { name: 'Ghee Karam Idli', description: 'Idli with ghee and spicy karam podi', price: 50, category: 'idli', image: '/assets/menu/idli-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 22, tags: ['ghee', 'karam'] },
  { name: 'Sambar Idli', description: 'Idli soaked in piping hot sambar', price: 45, category: 'idli', image: '/assets/menu/idli-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 23, tags: ['sambar'] },
  { name: 'Butter Idli', description: 'Idli cooked with butter', price: 50, category: 'idli', image: '/assets/menu/idli-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 24, tags: ['butter'] },
  { name: 'Butter Thatte Idli', description: 'Large flat idli with butter', price: 70, category: 'idli', image: '/assets/menu/idli-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 25, tags: ['butter'] },
  { name: 'Ragi Idli', description: 'Finger millet idli, healthy and light', price: 50, category: 'idli', image: '/assets/menu/idli-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 26, tags: ['ragi'] },
  { name: 'Mini Idli', description: 'Bite-sized idlis, great for kids', price: 45, category: 'idli', image: '/assets/menu/idli-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 27, tags: ['kids'] },
  { name: 'Masala fry Idli', description: 'Fried idli tossed with spices', price: 60, category: 'idli', image: '/assets/menu/idli-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 28, tags: ['masala'] },
  { name: 'Plain Dosa', description: 'Crisp golden dosa served with sambar & chutney', price: 90, category: 'benne_dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 30, tags: ['classic'] },
  { name: 'Podi Dosa', description: 'Dosa smeared with spicy gunpowder podi', price: 100, category: 'benne_dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 31, tags: ['podi'] },
  { name: 'Podi Masala Dosa', description: 'Podi dosa with spiced potato filling', price: 120, category: 'benne_dosa', image: '/assets/menu/dosa-2.jpg', isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 32, tags: ['podi', 'masala'] },
  { name: 'Cheese Podi Masala Dosa', description: 'Cheese, podi and masala — fully loaded', price: 130, category: 'benne_dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 33, tags: ['cheese', 'podi'] },
  { name: 'Cheese Plain Dosa', description: 'Classic dosa with melted cheese', price: 120, category: 'benne_dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 34, tags: ['cheese'] },
  { name: 'Cheese Podi Dosa', description: 'Cheese dosa with a spicy podi kick', price: 130, category: 'benne_dosa', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 35, tags: ['cheese', 'podi'] },
  { name: 'Plain Pesarattu', description: 'Andhra-style green gram dosa, served with upma', price: 60, category: 'pesarattu', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 40, tags: ['andhra'] },
  { name: 'Onion Pesarattu', description: 'Pesarattu topped with chopped onions', price: 60, category: 'pesarattu', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 41, tags: ['onion'] },
  { name: 'Upma Pesarattu', description: 'Pesarattu with a hearty upma filling', price: 70, category: 'pesarattu', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 42, tags: ['upma'] },
  { name: 'Ghee Podi Pesarattu', description: 'Pesarattu with ghee and podi', price: 80, category: 'pesarattu', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 43, tags: ['ghee', 'podi'] },
  { name: 'Ghee Karam Pesarattu', description: 'Pesarattu with spicy karam podi', price: 80, category: 'pesarattu', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 44, tags: ['ghee', 'karam'] },
  { name: 'Cheese Pesarattu', description: 'Pesarattu with melted cheese', price: 90, category: 'pesarattu', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 45, tags: ['cheese'] },
  { name: 'Panner Pesarattu', description: 'Pesarattu stuffed with paneer', price: 100, category: 'pesarattu', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 46, tags: ['paneer'] },
  { name: 'Masala Pasarattu', description: 'Pesarattu with spiced potato masala', price: 70, category: 'pesarattu', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 47, tags: ['masala'] },
  { name: 'Butter Pasarattu', description: 'Pesarattu cooked in butter', price: 80, category: 'pesarattu', image: '/assets/menu/dosa-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 48, tags: ['butter'] },
  { name: 'Plain Uttapam', description: 'Soft, thick pancake with onions & green chilli', price: 60, category: 'uttapam', image: '/assets/menu/uttapam-1.jpg', isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 50, tags: ['classic'] },
  { name: 'Onion Uttapam', description: 'Topped with fresh onions', price: 70, category: 'uttapam', image: '/assets/menu/uttapam-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 51, tags: ['onion'] },
  { name: 'Butter Uttapam', description: 'Cooked with butter', price: 80, category: 'uttapam', image: '/assets/menu/uttapam-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 52, tags: ['butter'] },
  { name: 'Ghee Podi Uttapam', description: 'Uttapam with ghee and podi', price: 90, category: 'uttapam', image: '/assets/menu/uttapam-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 53, tags: ['ghee', 'podi'] },
  { name: 'Ghee Karam Uttapam', description: 'Uttapam with spicy karam', price: 90, category: 'uttapam', image: '/assets/menu/uttapam-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 54, tags: ['ghee', 'karam'] },
  { name: 'Panner Uttapam', description: 'Uttapam topped with paneer', price: 100, category: 'uttapam', image: '/assets/menu/uttapam-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 55, tags: ['paneer'] },
  { name: 'Medu Vada (2 Pcs)', description: 'Two crisp urad dal vadas', price: 45, category: 'wada', image: '/assets/menu/vada-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 60, tags: ['classic'] },
  { name: 'Sambar Vada', description: 'Vadas soaked in sambar', price: 45, category: 'wada', image: '/assets/menu/vada-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 61, tags: ['sambar'] },
  { name: 'Vada Idli', description: 'One vada and two idlis — best of both', price: 45, category: 'wada', image: '/assets/menu/vada-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 62, tags: ['combo'] },
  { name: 'Mysore Bonda', description: 'Fluffy deep-fried bondas', price: 45, category: 'bonda', image: '/assets/menu/bonda-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 70, tags: ['fried'] },
  { name: 'Upma', description: 'Warm semolina upma', price: 45, category: 'upma', image: '/assets/menu/upma-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 80, tags: ['classic'] },
  { name: 'Hot Pongal', description: 'Ghee-rich rice & moong dal pongal', price: 50, category: 'upma', image: '/assets/menu/pesarattu-2.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 81, tags: ['pongal'] },
  { name: 'Sarvapindi (Sarvappa)', description: 'Traditional Telangana rice-flour snack with sesame & chana dal', price: 45, category: 'snacks', image: '/assets/menu/snacks-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 90, tags: ['telangana'] },
  { name: 'Paani Poori', description: 'Crispy puris with tangy pani (6 pcs)', price: 45, category: 'snacks', image: '/assets/menu/snacks-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 91, tags: ['street-food'] },
  { name: 'Poonugulu', description: 'Crispy fried lentil dumplings', price: 45, category: 'snacks', image: '/assets/menu/snacks-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 92, tags: ['fried'] },
  { name: 'Mirchi Bajji', description: 'Stuffed chilli fritters, hot & spicy', price: 45, category: 'snacks', image: '/assets/menu/snacks-1.jpg', isVeg: true, isAvailable: true, isPopular: true, spicyLevel: 0, sortOrder: 93, tags: ['spicy'] },
  { name: 'Poori (3 Pcs)', description: 'Three fluffy pooris', price: 45, category: 'poori', image: '/assets/menu/poori-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 100, tags: ['classic'] },
  { name: 'Poori Masala', description: 'Pooris served with spiced potato masala', price: 45, category: 'poori', image: '/assets/menu/poori-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 101, tags: ['masala'] },
  { name: 'Poori Kurma', description: 'Pooris with rich vegetable kurma', price: 45, category: 'poori', image: '/assets/menu/poori-1.jpg', isVeg: true, isAvailable: true, isPopular: false, spicyLevel: 0, sortOrder: 102, tags: ['kurma'] },
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

    // Menu (58 items)
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
