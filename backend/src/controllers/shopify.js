const prisma = require('../models');
const { syncShopifyData, setupWebhooks, shopifyRequest } = require('../services/shopify');

const syncData = async (req, res) => {
  try {
    await syncShopifyData(req.tenant);
    
    if (req.tenant.shopifyToken) {
      await setupWebhooks(req.tenant);
    }
    
    res.json({ message: 'Data sync completed' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
};

const registerWebhooks = async (req, res) => {
  try {
    if (!req.tenant.shopifyToken) {
      return res.status(400).json({ error: 'Shopify token required for webhook registration' });
    }
    
    await setupWebhooks(req.tenant);
    res.json({ message: 'Webhooks registered successfully' });
  } catch (error) {
    console.error('Webhook registration error:', error);
    res.status(500).json({ error: 'Webhook registration failed' });
  }
};

const getShopifyData = async (req, res) => {
  try {
    const { resource, id } = req.params;
    
    if (!['products', 'customers', 'orders'].includes(resource)) {
      return res.status(400).json({ error: 'Invalid resource type' });
    }
    
    const endpoint = id ? `${resource}/${id}.json` : `${resource}.json`;
    const response = await shopifyRequest(req.tenant, endpoint);
    
    res.json(response.data);
  } catch (error) {
    console.error('Shopify API error:', error);
    res.status(500).json({ error: 'Failed to fetch Shopify data' });
  }
};

module.exports = { 
  syncData, 
  registerWebhooks,
  getShopifyData 
};