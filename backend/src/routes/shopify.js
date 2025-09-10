const express = require('express');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { syncData, webhookHandler } = require('../controllers/shopify');

const router = express.Router();

router.post('/webhook', webhookHandler);
router.post('/sync', auth, tenant, syncData);

module.exports = router;