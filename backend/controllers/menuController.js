/**
 * controllers/menuController.js
 * Public menu listing (available items only) + admin menu CRUD.
 */
const MenuItem = require('../models/MenuItem');

const CATEGORIES = ['idli', 'dosa', 'benne_dosa', 'pesarattu', 'uttapam', 'wada', 'bonda', 'upma', 'snacks', 'poori'];
const ALLOWED_FIELDS = [
  'name',
  'description',
  'price',
  'category',
  'image',
  'isAvailable',
  'isPopular',
  'isVeg',
  'spicyLevel',
  'sortOrder',
];

/** Pick only the whitelisted menu fields from a request body. */
const pickFields = (body) => {
  const data = {};
  for (const field of ALLOWED_FIELDS) {
    if (body[field] !== undefined) data[field] = body[field];
  }
  return data;
};

/**
 * Build the query filter.
 * Returns null when ?category= is an invalid value (→ 400).
 */
const buildFilter = (query, { onlyAvailable = true } = {}) => {
  const filter = {};
  if (onlyAvailable) filter.isAvailable = true;

  if (query.category) {
    const category = CATEGORIES.find(
      (c) => c.toLowerCase() === String(query.category).toLowerCase()
    );
    if (!category) return null; // invalid category value
    filter.category = category; // store the canonical casing
  }
  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }
  if (query.popular === 'true') {
    filter.isPopular = true;
  }
  return filter;
};

/**
 * GET /api/menu?category=&search=&popular=
 * Public — only items with isAvailable: true.
 */
const getAll = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query);
    if (filter === null) {
      res.status(400);
      return next(new Error('Invalid category value'));
    }
    const items = await MenuItem.find(filter).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/menu/:id — public. 404 when missing or unavailable.
 */
const getOne = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item || !item.isAvailable) {
      res.status(404);
      return next(new Error('Menu item not found'));
    }
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/menu — includes unavailable items.
 */
const adminGetAll = async (req, res, next) => {
  try {
    const filter = buildFilter(req.query, { onlyAvailable: false });
    if (filter === null) {
      res.status(400);
      return next(new Error('Invalid category value'));
    }
    const items = await MenuItem.find(filter).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/menu — create (whitelisted fields only).
 */
const create = async (req, res, next) => {
  try {
    const data = pickFields(req.body || {});

    if (!data.name || !data.description || data.price === undefined || !data.category) {
      res.status(400);
      return next(new Error('name, description, price and category are required'));
    }
    if (typeof data.price !== 'number' || data.price < 0) {
      res.status(400);
      return next(new Error('Price must be a non-negative number'));
    }

    const item = await MenuItem.create(data);
    res.status(201).json({ success: true, message: 'Menu item added', data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/menu/:id — update whitelisted fields.
 */
const update = async (req, res, next) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) {
      res.status(404);
      return next(new Error('Menu item not found'));
    }

    Object.assign(item, pickFields(req.body || {}));
    await item.save();

    res.json({ success: true, message: 'Menu item updated', data: item });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/menu/:id
 */
const remove = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) {
      res.status(404);
      return next(new Error('Menu item not found'));
    }
    res.json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getOne,
  adminGetAll,
  create,
  update,
  remove,
  // Allowed menu categories (reused by the seed script in Step 3)
  CATEGORIES,
};