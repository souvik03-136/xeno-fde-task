const express = require('express');
const auth = require('../middleware/auth');
const { createTenant, getTenants } = require('../controllers/tenant');

const router = express.Router();

router.use(auth);
router.post('/', createTenant);
router.get('/', getTenants);

module.exports = router;