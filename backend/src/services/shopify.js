const axios = require('axios');
const prisma = require('../models');

const shopifyRequest = async (tenant, endpoint, method = 'GET', data = null) => {
  const url = `https://${tenant.shopifyDomain}/admin/api/2023-10/${endpoint}`;
  
  try {
    const response = await axios({
      method,
      url,
      headers: {
        'X-Shopify-Access-Token': tenant.shopifyToken,
        'Content-Type': 'application/json'
      },
      data,
      timeout: 30000
    });
    
    return response;
  } catch (error) {
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 10;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return shopifyRequest(tenant, endpoint, method, data);
    }
    throw error;
  }
};

const getAllPages = async (tenant, endpoint) => {
  let allData = [];
  let nextPage = null;
  let page = 1;
  
  do {
    try {
      const url = nextPage || `${endpoint}?limit=250&page=${page}`;
      const response = await shopifyRequest(tenant, url);
      
      const data = response.data;
      const resourceKey = Object.keys(data).find(key => Array.isArray(data[key]));
      
      if (resourceKey) {
        allData = allData.concat(data[resourceKey]);
      }
      
      const linkHeader = response.headers['link'];
      nextPage = null;
      
      if (linkHeader) {
        const links = linkHeader.split(',');
        const nextLink = links.find(link => link.includes('rel="next"'));
        
        if (nextLink) {
          const match = nextLink.match(/<([^>]+)>/);
          if (match) {
            const url = new URL(match[1]);
            nextPage = `${url.pathname}${url.search}`;
          }
        }
      }
      
      page++;
      
      if (!nextPage && data[resourceKey]?.length === 250) {
        nextPage = `${endpoint}?limit=250&page=${page}`;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error fetching page ${page} for ${endpoint}:`, error.message);
      break;
    }
  } while (nextPage);
  
  return allData;
};

const syncShopifyData = async (tenant) => {
  try {
    console.log(`Starting sync for tenant: ${tenant.name}`);
    
    await Promise.all([
      syncCustomers(tenant),
      syncProducts(tenant),
      syncOrders(tenant)
    ]);
    
    console.log(`Completed sync for tenant: ${tenant.name}`);
  } catch (error) {
    console.error('Shopify sync error:', error);
    throw error;
  }
};

const syncCustomers = async (tenant) => {
  try {
    const customers = await getAllPages(tenant, 'customers.json');
    
    for (const customer of customers) {
      await prisma.customer.upsert({
        where: {
          shopifyId_tenantId: {
            shopifyId: customer.id.toString(),
            tenantId: tenant.id
          }
        },
        update: {
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          totalSpent: parseFloat(customer.total_spent || 0),
          ordersCount: parseInt(customer.orders_count || 0)
        },
        create: {
          shopifyId: customer.id.toString(),
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          totalSpent: parseFloat(customer.total_spent || 0),
          ordersCount: parseInt(customer.orders_count || 0),
          tenantId: tenant.id
        }
      });
    }
    
    console.log(`Synced ${customers.length} customers for tenant: ${tenant.name}`);
  } catch (error) {
    console.error('Customer sync error:', error);
    throw error;
  }
};

const syncProducts = async (tenant) => {
  try {
    const products = await getAllPages(tenant, 'products.json');
    
    for (const product of products) {
      const variant = product.variants[0];
      
      await prisma.product.upsert({
        where: {
          shopifyId_tenantId: {
            shopifyId: product.id.toString(),
            tenantId: tenant.id
          }
        },
        update: {
          title: product.title,
          price: parseFloat(variant?.price || 0)
        },
        create: {
          shopifyId: product.id.toString(),
          title: product.title,
          price: parseFloat(variant?.price || 0),
          tenantId: tenant.id
        }
      });
    }
    
    console.log(`Synced ${products.length} products for tenant: ${tenant.name}`);
  } catch (error) {
    console.error('Product sync error:', error);
    throw error;
  }
};

const syncOrders = async (tenant) => {
  try {
    const orders = await getAllPages(tenant, 'orders.json');
    
    for (const order of orders) {
      let customer = null;
      
      if (order.customer) {
        customer = await prisma.customer.findFirst({
          where: {
            shopifyId: order.customer.id.toString(),
            tenantId: tenant.id
          }
        });
        
        if (!customer && order.customer) {
          customer = await prisma.customer.create({
            data: {
              shopifyId: order.customer.id.toString(),
              email: order.customer.email,
              firstName: order.customer.first_name,
              lastName: order.customer.last_name,
              tenantId: tenant.id
            }
          });
        }
      }
      
      if (!customer) continue;
      
      const createdOrder = await prisma.order.upsert({
        where: {
          shopifyId_tenantId: {
            shopifyId: order.id.toString(),
            tenantId: tenant.id
          }
        },
        update: {
          orderNumber: order.order_number.toString(),
          totalPrice: parseFloat(order.total_price || 0),
          orderDate: new Date(order.created_at),
          customerId: customer.id
        },
        create: {
          shopifyId: order.id.toString(),
          orderNumber: order.order_number.toString(),
          totalPrice: parseFloat(order.total_price || 0),
          orderDate: new Date(order.created_at),
          customerId: customer.id,
          tenantId: tenant.id
        }
      });
      
      for (const lineItem of order.line_items || []) {
        let product = await prisma.product.findFirst({
          where: {
            shopifyId: lineItem.product_id?.toString(),
            tenantId: tenant.id
          }
        });
        
        if (!product && lineItem.product_id) {
          product = await prisma.product.create({
            data: {
              shopifyId: lineItem.product_id.toString(),
              title: lineItem.title,
              price: parseFloat(lineItem.price || 0),
              tenantId: tenant.id
            }
          });
        }
        
        if (product) {
          await prisma.orderItem.upsert({
            where: {
              id: `${createdOrder.id}-${lineItem.id}`
            },
            update: {
              quantity: lineItem.quantity,
              price: parseFloat(lineItem.price)
            },
            create: {
              id: `${createdOrder.id}-${lineItem.id}`,
              quantity: lineItem.quantity,
              price: parseFloat(lineItem.price),
              orderId: createdOrder.id,
              productId: product.id
            }
          });
        }
      }
    }
    
    console.log(`Synced ${orders.length} orders for tenant: ${tenant.name}`);
  } catch (error) {
    console.error('Order sync error:', error);
    throw error;
  }
};

const setupWebhooks = async (tenant) => {
  try {
    const webhookTopics = [
      'orders/create',
      'orders/updated',
      'orders/cancelled',
      'customers/create',
      'customers/update',
      'carts/update',
      'checkouts/create',
      'checkouts/update'
    ];
    
    const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || `https://${process.env.RENDER_EXTERNAL_URL || 'localhost:3001'}`;
    
    for (const topic of webhookTopics) {
      const webhookAddress = `${webhookBaseUrl}/api/webhook/${tenant.id}`;
      
      try {
        await shopifyRequest(tenant, 'webhooks.json', 'POST', {
          webhook: {
            topic,
            address: webhookAddress,
            format: 'json'
          }
        });
        
        await prisma.webhook.upsert({
          where: {
            topic_tenantId: {
              topic,
              tenantId: tenant.id
            }
          },
          update: {
            address: webhookAddress
          },
          create: {
            topic,
            address: webhookAddress,
            tenantId: tenant.id
          }
        });
        
        console.log(`Registered webhook for ${topic} for tenant: ${tenant.name}`);
      } catch (error) {
        if (error.response?.status === 422) {
          console.log(`Webhook already exists for ${topic} for tenant: ${tenant.name}`);
        } else {
          console.error(`Error setting up webhook for ${topic}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error('Webhook setup error:', error);
  }
};

module.exports = { 
  syncShopifyData, 
  setupWebhooks,
  shopifyRequest 
};