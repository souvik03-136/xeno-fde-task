const express = require('express');
const auth = require('../middleware/auth');
const { createTenant, getTenants } = require('../controllers/tenant');
const { validateTenant } = require('../middleware/validation');

const router = express.Router();

router.use(auth);
router.post('/', validateTenant, createTenant);
router.get('/', getTenants);

module.exports = router;