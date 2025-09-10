const express = require('express');
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { syncData, registerWebhooks, getShopifyData } = require('../controllers/shopify');

const router = express.Router();

router.post('/sync', auth, tenant, syncData);
router.post('/webhooks/register', auth, tenant, registerWebhooks);
router.get('/:resource', auth, tenant, getShopifyData);
router.get('/:resource/:id', auth, tenant, getShopifyData);

module.exports = router;