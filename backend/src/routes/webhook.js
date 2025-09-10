const express = require('express');
const prisma = require('../models');
const verifyWebhook = require('../middleware/verifyWebhook');
const { handleOrderCreate, handleCustomerCreate, handleCartUpdate } = require('../controllers/webhookHandler');

const router = express.Router();

router.post('/:tenantId', verifyWebhook, async (req, res) => {
  try {
    const { tenantId } = req.params;
    const topic = req.webhookTopic;
    const data = req.body;
    
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });
    
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    
    req.tenant = tenant;
    
    switch (topic) {
      case 'orders/create':
        await handleOrderCreate(data, tenant);
        break;
      case 'orders/updated':
        await handleOrderCreate(data, tenant);
        break;
      case 'customers/create':
        await handleCustomerCreate(data, tenant);
        break;
      case 'customers/update':
        await handleCustomerCreate(data, tenant);
        break;
      case 'carts/update':
        await handleCartUpdate(data, tenant);
        break;
      case 'checkouts/create':
        console.log('Checkout created:', data);
        break;
      case 'checkouts/update':
        console.log('Checkout updated:', data);
        break;
      default:
        console.log('Unhandled webhook topic:', topic);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;