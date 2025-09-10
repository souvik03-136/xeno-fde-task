const prisma = require('../models');
const { syncShopifyData } = require('../services/shopify');

const syncData = async (req, res) => {
  try {
    await syncShopifyData(req.tenant);
    res.json({ message: 'Data sync completed' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
};

const webhookHandler = async (req, res) => {
  try {
    const { topic } = req.headers;
    const data = req.body;

    switch (topic) {
      case 'orders/create':
        await handleOrderCreate(data);
        break;
      case 'customers/create':
        await handleCustomerCreate(data);
        break;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

const handleOrderCreate = async (orderData) => {
  const tenant = await prisma.tenant.findFirst({
    where: { shopifyDomain: orderData.domain }
  });

  if (!tenant) return;

  await prisma.order.upsert({
    where: {
      shopifyId_tenantId: {
        shopifyId: orderData.id.toString(),
        tenantId: tenant.id
      }
    },
    update: {
      totalPrice: parseFloat(orderData.total_price)
    },
    create: {
      shopifyId: orderData.id.toString(),
      orderNumber: orderData.order_number,
      totalPrice: parseFloat(orderData.total_price),
      orderDate: new Date(orderData.created_at),
      tenantId: tenant.id,
      customerId: 'temp-customer-id'
    }
  });
};

const handleCustomerCreate = async (customerData) => {
  const tenant = await prisma.tenant.findFirst({
    where: { shopifyDomain: customerData.domain }
  });

  if (!tenant) return;

  await prisma.customer.upsert({
    where: {
      shopifyId_tenantId: {
        shopifyId: customerData.id.toString(),
        tenantId: tenant.id
      }
    },
    update: {
      email: customerData.email,
      firstName: customerData.first_name,
      lastName: customerData.last_name
    },
    create: {
      shopifyId: customerData.id.toString(),
      email: customerData.email,
      firstName: customerData.first_name,
      lastName: customerData.last_name,
      tenantId: tenant.id
    }
  });
};

module.exports = { syncData, webhookHandler };