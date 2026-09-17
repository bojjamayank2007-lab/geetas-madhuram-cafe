/**
 * routes/menu.js
 * Public menu routes (available items only).
 */
const express = require('express');
const router = express.Router();

const { getAll, getOne } = require('../controllers/menuController');

router.get('/', getAll);
router.get('/:id', getOne);

module.exports = router;