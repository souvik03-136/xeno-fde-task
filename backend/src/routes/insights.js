const express = require('express');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { getDashboardStats, getAbandonedCarts } = require('../controllers/insights');

const router = express.Router();

router.use(auth);
router.use(tenant);
router.get('/dashboard', getDashboardStats);
router.get('/abandoned-carts', getAbandonedCarts);

module.exports = router;