const axios = require('axios');
const prisma = require('../models');

const shopifyRequest = async (tenant, endpoint, method = 'GET', data = null) => {
  const url = `https://${tenant.shopifyDomain}/admin/api/2023-10/${endpoint}`;
  
  return axios({
    method,
    url,
    headers: {
      'X-Shopify-Access-Token': tenant.shopifyToken,
      'Content-Type': 'application/json'
    },
    data
  });
};

const syncShopifyData = async (tenant) => {
  try {
    await syncCustomers(tenant);
    await syncProducts(tenant);
    await syncOrders(tenant);
  } catch (error) {
    console.error('Shopify sync error:', error);
    throw error;
  }
};

const syncCustomers = async (tenant) => {
  try {
    const response = await shopifyRequest(tenant, 'customers.json');
    const customers = response.data.customers;

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
  } catch (error) {
    console.error('Customer sync error:', error);
  }
};

const syncProducts = async (tenant) => {
  try {
    const response = await shopifyRequest(tenant, 'products.json');
    const products = response.data.products;

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
          price: parseFloat(variant.price)
        },
        create: {
          shopifyId: product.id.toString(),
          title: product.title,
          price: parseFloat(variant.price),
          tenantId: tenant.id
        }
      });
    }
  } catch (error) {
    console.error('Product sync error:', error);
  }
};

const syncOrders = async (tenant) => {
  try {
    const response = await shopifyRequest(tenant, 'orders.json');
    const orders = response.data.orders;

    for (const order of orders) {
      const customer = await prisma.customer.findFirst({
        where: {
          shopifyId: order.customer?.id?.toString(),
          tenantId: tenant.id
        }
      });

      if (!customer) continue;

      const createdOrder = await prisma.order.upsert({
        where: {
          shopifyId_tenantId: {
            shopifyId: order.id.toString(),
            tenantId: tenant.id
          }
        },
        update: {
          orderNumber: order.order_number,
          totalPrice: parseFloat(order.total_price),
          orderDate: new Date(order.created_at)
        },
        create: {
          shopifyId: order.id.toString(),
          orderNumber: order.order_number,
          totalPrice: parseFloat(order.total_price),
          orderDate: new Date(order.created_at),
          customerId: customer.id,
          tenantId: tenant.id
        }
      });

      for (const lineItem of order.line_items) {
        const product = await prisma.product.findFirst({
          where: {
            shopifyId: lineItem.product_id?.toString(),
            tenantId: tenant.id
          }
        });

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
  } catch (error) {
    console.error('Order sync error:', error);
  }
};

module.exports = { syncShopifyData };