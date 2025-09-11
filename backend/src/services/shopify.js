const axios = require('axios');
const prisma = require('../models');

let workingApiVersion = '2023-10';
let availableEndpoints = [];
let connectionTested = false;

const shopifyRequest = async (tenant, endpoint, method = 'GET', data = null) => {
  const domain = process.env.SHOPIFY_DOMAIN || tenant.shopifyDomain;
  const token = process.env.SHOPIFY_ACCESS_TOKEN || tenant.shopifyToken;
  
  // Use detected working version or default
  const apiVersion = process.env.SHOPIFY_API_VERSION || workingApiVersion;
  const baseUrl = `https://${domain}/admin/api/${apiVersion}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}/${endpoint.replace(/^\//, '')}`;
  
  console.log(`Making request to: ${url}`);
  
  try {
    const response = await axios({
      method,
      url,
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Shoplytics/1.0'
      },
      data,
      timeout: 30000
    });
    
    console.log(`Request successful: ${response.status}`);
    return response;
  } catch (error) {
    console.error(`API Error for ${url}:`, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data || error.message
    });
    throw error;
  }
};

const testConnection = async (tenant) => {
  if (connectionTested) {
    return { version: workingApiVersion, endpoints: availableEndpoints };
  }
  
  console.log('Testing Shopify connection...');
  
  // We know from diagnostics that 2023-10 works and customers is available
  workingApiVersion = '2023-10';
  availableEndpoints = ['customers'];
  
  // Still test for products and orders in case permissions changed
  const domain = process.env.SHOPIFY_DOMAIN || tenant.shopifyDomain;
  const token = process.env.SHOPIFY_ACCESS_TOKEN || tenant.shopifyToken;
  
  const endpointsToTest = [
    { name: 'products', endpoint: 'products.json?limit=1' },
    { name: 'orders', endpoint: 'orders.json?limit=1' }
  ];
  
  for (const test of endpointsToTest) {
    try {
      await axios.get(`https://${domain}/admin/api/${workingApiVersion}/${test.endpoint}`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      availableEndpoints.push(test.name);
      console.log(`${test.name} endpoint now available!`);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`${test.name} endpoint: Still needs merchant approval`);
      }
    }
  }
  
  connectionTested = true;
  console.log(`Available endpoints: ${availableEndpoints.join(', ')}`);
  
  return { version: workingApiVersion, endpoints: availableEndpoints };
};

const getAllPages = async (tenant, endpoint) => {
  let allData = [];
  let page = 1;
  const limit = 50;
  let hasMore = true;
  
  console.log(`Fetching all pages for: ${endpoint}`);
  
  while (hasMore && page <= 20) {
    try {
      // Try simple pagination first
      let url = endpoint;
      if (!url.includes('?')) {
        url += `?limit=${limit}`;
      } else if (!url.includes('limit=')) {
        url += `&limit=${limit}`;
      }
      
      const response = await shopifyRequest(tenant, url);
      const data = response.data;
      const resourceKey = Object.keys(data).find(key => Array.isArray(data[key]));
      
      if (resourceKey && data[resourceKey].length > 0) {
        allData = allData.concat(data[resourceKey]);
        console.log(`Page ${page}: ${data[resourceKey].length} items`);
        
        // Simple check: if we got less than limit, probably last page
        hasMore = data[resourceKey].length === limit;
        page++;
      } else {
        hasMore = false;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      if (error.response?.status === 400 && page === 1) {
        // Pagination might not be supported, try without it
        try {
          console.log('Trying without pagination...');
          const simpleResponse = await shopifyRequest(tenant, endpoint.split('?')[0] + '.json');
          const simpleData = simpleResponse.data;
          const simpleResourceKey = Object.keys(simpleData).find(key => Array.isArray(simpleData[key]));
          
          if (simpleResourceKey) {
            allData = simpleData[simpleResourceKey];
            console.log(`Got ${allData.length} items without pagination`);
          }
        } catch (simpleError) {
          console.error('Simple request also failed:', simpleError.response?.status);
        }
      }
      
      hasMore = false;
    }
  }
  
  console.log(`Total fetched: ${allData.length} items`);
  return allData;
};

const syncShopifyData = async (tenant = null) => {
  const defaultTenant = {
    id: 1,
    name: process.env.SHOPIFY_DOMAIN || 'development-store',
    shopifyDomain: process.env.SHOPIFY_DOMAIN,
    shopifyToken: process.env.SHOPIFY_ACCESS_TOKEN
  };
  
  const activeTenant = tenant || defaultTenant;
  
  try {
    console.log(`Starting sync for: ${activeTenant.name}`);
    
    // Test connection and get available endpoints
    const connectionInfo = await testConnection(activeTenant);
    console.log(`Using API version: ${connectionInfo.version}`);
    console.log(`Available endpoints: ${connectionInfo.endpoints.join(', ')}`);
    
    // Only sync what's available
    if (connectionInfo.endpoints.includes('customers')) {
      console.log('Syncing customers...');
      await syncCustomers(activeTenant);
    }
    
    if (connectionInfo.endpoints.includes('products')) {
      console.log('Syncing products...');
      await syncProducts(activeTenant);
    }
    
    if (connectionInfo.endpoints.includes('orders')) {
      console.log('Syncing orders...');
      await syncOrders(activeTenant);
    }
    
    if (connectionInfo.endpoints.length === 0) {
      console.log('No accessible endpoints found. Check your app permissions.');
    }
    
    console.log(`Sync completed for: ${activeTenant.name}`);
  } catch (error) {
    console.error('Sync failed:', error.message);
    throw error;
  }
};

const syncCustomers = async (tenant) => {
  try {
    console.log('Starting customer sync...');
    
    const customers = await getAllPages(tenant, 'customers.json');
    console.log(`Processing ${customers.length} customers`);
    
    let syncCount = 0;
    for (const customer of customers) {
      try {
        await prisma.customer.upsert({
          where: {
            shopifyId_tenantId: {
              shopifyId: customer.id.toString(),
              tenantId: tenant.id
            }
          },
          update: {
            email: customer.email || '',
            firstName: customer.first_name || '',
            lastName: customer.last_name || '',
            totalSpent: parseFloat(customer.total_spent || 0),
            ordersCount: parseInt(customer.orders_count || 0),
            updatedAt: new Date()
          },
          create: {
            shopifyId: customer.id.toString(),
            email: customer.email || '',
            firstName: customer.first_name || '',
            lastName: customer.last_name || '',
            totalSpent: parseFloat(customer.total_spent || 0),
            ordersCount: parseInt(customer.orders_count || 0),
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        syncCount++;
      } catch (dbError) {
        console.error(`Error saving customer ${customer.id}:`, dbError.message);
      }
    }
    
    console.log(`Successfully synced ${syncCount} customers`);
  } catch (error) {
    console.error('Customer sync error:', error.message);
    throw error;
  }
};

const syncProducts = async (tenant) => {
  try {
    console.log('Starting product sync...');
    
    const products = await getAllPages(tenant, 'products.json');
    console.log(`Processing ${products.length} products`);
    
    let syncCount = 0;
    for (const product of products) {
      try {
        const variant = product.variants?.[0];
        const price = variant ? parseFloat(variant.price || 0) : 0;
        
        await prisma.product.upsert({
          where: {
            shopifyId_tenantId: {
              shopifyId: product.id.toString(),
              tenantId: tenant.id
            }
          },
          update: {
            title: product.title || '',
            price: price,
            updatedAt: new Date()
          },
          create: {
            shopifyId: product.id.toString(),
            title: product.title || '',
            price: price,
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        syncCount++;
      } catch (dbError) {
        console.error(`Error saving product ${product.id}:`, dbError.message);
      }
    }
    
    console.log(`Successfully synced ${syncCount} products`);
  } catch (error) {
    console.error('Product sync error:', error.message);
    throw error;
  }
};

const syncOrders = async (tenant) => {
  try {
    console.log('Starting order sync...');
    
    const orders = await getAllPages(tenant, 'orders.json');
    console.log(`Processing ${orders.length} orders`);
    
    let syncCount = 0;
    for (const order of orders) {
      try {
        // Handle customer
        let customer = null;
        if (order.customer && order.customer.id) {
          customer = await prisma.customer.findFirst({
            where: {
              shopifyId: order.customer.id.toString(),
              tenantId: tenant.id
            }
          });
          
          if (!customer) {
            customer = await prisma.customer.create({
              data: {
                shopifyId: order.customer.id.toString(),
                email: order.customer.email || '',
                firstName: order.customer.first_name || '',
                lastName: order.customer.last_name || '',
                totalSpent: 0,
                ordersCount: 0,
                tenantId: tenant.id,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
        }
        
        if (!customer) {
          console.log(`Skipping order ${order.id} - no customer data`);
          continue;
        }
        
        // Create/update order
        const createdOrder = await prisma.order.upsert({
          where: {
            shopifyId_tenantId: {
              shopifyId: order.id.toString(),
              tenantId: tenant.id
            }
          },
          update: {
            orderNumber: order.order_number?.toString() || order.id.toString(),
            totalPrice: parseFloat(order.total_price || 0),
            orderDate: new Date(order.created_at),
            customerId: customer.id,
            updatedAt: new Date()
          },
          create: {
            shopifyId: order.id.toString(),
            orderNumber: order.order_number?.toString() || order.id.toString(),
            totalPrice: parseFloat(order.total_price || 0),
            orderDate: new Date(order.created_at),
            customerId: customer.id,
            tenantId: tenant.id,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        // Handle line items
        for (const lineItem of order.line_items || []) {
          if (!lineItem.product_id) continue;
          
          let product = await prisma.product.findFirst({
            where: {
              shopifyId: lineItem.product_id.toString(),
              tenantId: tenant.id
            }
          });
          
          if (!product) {
            product = await prisma.product.create({
              data: {
                shopifyId: lineItem.product_id.toString(),
                title: lineItem.title || lineItem.name || 'Unknown Product',
                price: parseFloat(lineItem.price || 0),
                tenantId: tenant.id,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
          }
          
          await prisma.orderItem.upsert({
            where: {
              id: `${createdOrder.id}-${lineItem.id}`
            },
            update: {
              quantity: lineItem.quantity || 1,
              price: parseFloat(lineItem.price || 0),
              updatedAt: new Date()
            },
            create: {
              id: `${createdOrder.id}-${lineItem.id}`,
              quantity: lineItem.quantity || 1,
              price: parseFloat(lineItem.price || 0),
              orderId: createdOrder.id,
              productId: product.id,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
        }
        
        syncCount++;
      } catch (dbError) {
        console.error(`Error saving order ${order.id}:`, dbError.message);
      }
    }
    
    console.log(`Successfully synced ${syncCount} orders`);
  } catch (error) {
    console.error('Order sync error:', error.message);
    throw error;
  }
};

const setupWebhooks = async (tenant = null) => {
  console.log('Webhook setup - implement as needed');
};

module.exports = { 
  syncShopifyData, 
  setupWebhooks,
  shopifyRequest,
  testConnection
};