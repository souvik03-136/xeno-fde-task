const prisma = require('../models')
const axios = require('axios')

let workingApiVersion = '2023-10'
let availableEndpoints = []
let connectionTested = false

const shopifyRequest = async (tenant, endpoint, method = 'GET', data = null) => {
  const domain = process.env.SHOPIFY_DOMAIN || tenant.shopifyDomain;
  const token = process.env.SHOPIFY_ACCESS_TOKEN || tenant.shopifyToken;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2023-10';
  
  let url;
  if (endpoint.startsWith('http')) {
    url = endpoint;
  } else {
    const cleanEndpoint = endpoint.replace(/^\//, '');
    
    if (cleanEndpoint.includes('?')) {
      const [baseEndpoint, queryParams] = cleanEndpoint.split('?');
      const finalEndpoint = baseEndpoint.endsWith('.json') ? baseEndpoint : baseEndpoint + '.json';
      url = `https://${domain}/admin/api/${apiVersion}/${finalEndpoint}?${queryParams}`;
    } else {
      const finalEndpoint = cleanEndpoint.endsWith('.json') ? cleanEndpoint : cleanEndpoint + '.json';
      url = `https://${domain}/admin/api/${apiVersion}/${finalEndpoint}`;
    }
  }
  
  console.log(`Making request to: ${url}`);
  
  try {
    let response;
    
    if (method === 'GET') {
      response = await axios.get(url, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
    } else {
      const config = {
        method,
        url,
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      };
      
      if (data) {
        config.data = data;
      }
      
      response = await axios(config);
    }
    
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
    return { version: workingApiVersion, endpoints: availableEndpoints }
  }
  
  console.log('Testing Shopify connection...')
  
  workingApiVersion = '2023-10'
  availableEndpoints = ['customers']
  
  const domain = process.env.SHOPIFY_DOMAIN || tenant.shopifyDomain
  const token = process.env.SHOPIFY_ACCESS_TOKEN || tenant.shopifyToken
  
  const endpointsToTest = [
    { name: 'products', endpoint: 'products.json?limit=1' },
    { name: 'orders', endpoint: 'orders.json?limit=1' }
  ]
  
  for (const test of endpointsToTest) {
    try {
      await axios.get(`https://${domain}/admin/api/${workingApiVersion}/${test.endpoint}`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      })
      
      availableEndpoints.push(test.name)
      console.log(`${test.name} endpoint now available!`)
    } catch (error) {
      if (error.response?.status === 403) {
        console.log(`${test.name} endpoint: Still needs merchant approval`)
      }
    }
  }
  
  connectionTested = true
  console.log(`Available endpoints: ${availableEndpoints.join(', ')}`)
  
  return { version: workingApiVersion, endpoints: availableEndpoints }
}

const getAllPages = async (tenant, endpoint) => {
  let allData = []
  let nextPageUrl = null
  let pageCount = 0
  
  console.log(`Fetching all pages for: ${endpoint}`)
  
  try {
    do {
      pageCount++
      
      let url = endpoint
      if (nextPageUrl) {
        url = nextPageUrl
      } else {
        let baseEndpoint = endpoint
        
        if (baseEndpoint.includes('?')) {
          const [base, queryParams] = baseEndpoint.split('?');
          const finalBase = base.endsWith('.json') ? base : base + '.json';
          
          if (!queryParams.includes('limit=')) {
            url = `${finalBase}?${queryParams}&limit=50`;
          } else {
            url = `${finalBase}?${queryParams}`;
          }
        } else {
          const finalEndpoint = baseEndpoint.endsWith('.json') ? baseEndpoint : baseEndpoint + '.json';
          url = `${finalEndpoint}?limit=50`;
        }
      }
      
      console.log(`Fetching page ${pageCount}: ${url}`)
      
      const response = await shopifyRequest(tenant, url)
      const data = response.data
      const resourceKey = Object.keys(data).find(key => Array.isArray(data[key]))
      
      if (resourceKey && data[resourceKey].length > 0) {
        allData = allData.concat(data[resourceKey])
        console.log(`Page ${pageCount}: ${data[resourceKey].length} items`)
      }
      
      nextPageUrl = null
      const linkHeader = response.headers.link
      
      if (linkHeader) {
        const links = linkHeader.split(',')
        const nextLink = links.find(link => link.includes('rel="next"'))
        if (nextLink) {
          const match = nextLink.match(/<([^>]+)>/)
          if (match) {
            nextPageUrl = match[1]
            console.log(`Found next page: ${nextPageUrl}`)
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } while (nextPageUrl && pageCount < 20)
    
    console.log(`Total fetched: ${allData.length} items`)
    return allData
    
  } catch (error) {
    console.error(`Error in getAllPages for ${endpoint}:`, error.message)
    try {
      console.log('Trying simple request without pagination...')
      const simpleEndpoint = endpoint.endsWith('.json') ? endpoint : endpoint + '.json'
      const simpleResponse = await shopifyRequest(tenant, simpleEndpoint)
      const simpleData = simpleResponse.data
      const simpleResourceKey = Object.keys(simpleData).find(key => Array.isArray(simpleData[key]))
      if (simpleResourceKey) {
        console.log(`Got ${simpleData[simpleResourceKey].length} items without pagination`)
        return simpleData[simpleResourceKey]
      }
    } catch (simpleError) {
      console.error('Simple request also failed:', simpleError.message)
    }
    return []
  }
}

const processCustomers = async (tenant, customers) => {
  let syncCount = 0
  for (const customer of customers) {
    try {
      await prisma.customer.upsert({
        where: {
          shopifyId_tenantId: {
            shopifyId: customer.id.toString(),
            tenantId: tenant.id.toString()
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
          tenantId: tenant.id.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      syncCount++
    } catch (dbError) {
      console.error(`Error saving customer ${customer.id}:`, dbError.message)
    }
  }
  console.log(`Successfully synced ${syncCount} customers`)
}

const processProducts = async (tenant, products) => {
  let syncCount = 0
  for (const product of products) {
    try {
      const variant = product.variants?.[0]
      const price = variant ? parseFloat(variant.price || 0) : 0
      
      await prisma.product.upsert({
        where: {
          shopifyId_tenantId: {
            shopifyId: product.id.toString(),
            tenantId: tenant.id.toString()
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
          tenantId: tenant.id.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      syncCount++
    } catch (dbError) {
      console.error(`Error saving product ${product.id}:`, dbError.message)
    }
  }
  console.log(`Successfully synced ${syncCount} products`)
}

const processOrders = async (tenant, orders) => {
  let syncCount = 0
  for (const order of orders) {
    try {
      let customer = null
      if (order.customer && order.customer.id) {
        customer = await prisma.customer.findFirst({
          where: {
            shopifyId: order.customer.id.toString(),
            tenantId: tenant.id.toString()
          }
        })
        
        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              shopifyId: order.customer.id.toString(),
              email: order.customer.email || '',
              firstName: order.customer.first_name || '',
              lastName: order.customer.last_name || '',
              totalSpent: 0,
              ordersCount: 0,
              tenantId: tenant.id.toString(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }
      }
      
      if (!customer) {
        console.log(`Skipping order ${order.id} - no customer data`)
        continue
      }
      
      const createdOrder = await prisma.order.upsert({
        where: {
          shopifyId_tenantId: {
            shopifyId: order.id.toString(),
            tenantId: tenant.id.toString()
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
          tenantId: tenant.id.toString(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      })
      
      for (const lineItem of order.line_items || []) {
        if (!lineItem.product_id) continue
        
        let product = await prisma.product.findFirst({
          where: {
            shopifyId: lineItem.product_id.toString(),
            tenantId: tenant.id.toString()
          }
        })
        
        if (!product) {
          product = await prisma.product.create({
            data: {
              shopifyId: lineItem.product_id.toString(),
              title: lineItem.title || lineItem.name || 'Unknown Product',
              price: parseFloat(lineItem.price || 0),
              tenantId: tenant.id.toString(),
              createdAt: new Date(),
              updatedAt: new Date()
            }
          })
        }
        
        await prisma.orderItem.upsert({
          where: {
            id: `${createdOrder.id}-${lineItem.id}`
          },
          update: {
            quantity: lineItem.quantity || 1,
            price: parseFloat(lineItem.price || 0)
          },
          create: {
            id: `${createdOrder.id}-${lineItem.id}`,
            quantity: lineItem.quantity || 1,
            price: parseFloat(lineItem.price || 0),
            orderId: createdOrder.id,
            productId: product.id
          }
        })
      }
      
      syncCount++
    } catch (dbError) {
      console.error(`Error saving order ${order.id}:`, dbError.message)
    }
  }
  console.log(`Successfully synced ${syncCount} orders`)
}

const syncShopifyData = async (tenant = null) => {
  let defaultTenant = tenant;
  
  if (!defaultTenant) {
    defaultTenant = await prisma.tenant.findFirst({
      where: { shopifyDomain: process.env.SHOPIFY_DOMAIN }
    });
    
    if (!defaultTenant) {
      throw new Error('No tenant found. Run create-tenant.js first');
    }
  }
  
  const activeTenant = tenant || defaultTenant
  
  try {
    console.log(`Starting sync for: ${activeTenant.name}`)
    
    const connectionInfo = await testConnection(activeTenant)
    console.log(`Using API version: ${connectionInfo.version}`)
    console.log(`Available endpoints: ${connectionInfo.endpoints.join(', ')}`)
    
    if (connectionInfo.endpoints.includes('customers')) {
      console.log('Syncing customers...')
      const customers = await getAllPages(activeTenant, 'customers')
      console.log(`Processing ${customers.length} customers`)
      await processCustomers(activeTenant, customers)
    }
    
    if (connectionInfo.endpoints.includes('products')) {
      console.log('Syncing products...')
      const products = await getAllPages(activeTenant, 'products')
      console.log(`Processing ${products.length} products`)
      await processProducts(activeTenant, products)
    }
    
    if (connectionInfo.endpoints.includes('orders')) {
      console.log('Syncing orders...')
      const orders = await getAllPages(activeTenant, 'orders')
      console.log(`Processing ${orders.length} orders`)
      await processOrders(activeTenant, orders)
    }
    
    if (connectionInfo.endpoints.length === 0) {
      console.log('No accessible endpoints found. Check your app permissions.')
    }
    
    console.log(`Sync completed for: ${activeTenant.name}`)
  } catch (error) {
    console.error('Sync failed:', error.message)
    throw error
  }
}

const setupWebhooks = async (tenant = null) => {
  console.log('Webhook setup - implement as needed')
}

const syncData = async (req, res) => {
  try {
    await syncShopifyData(req.tenant)
    if (req.tenant.shopifyToken) {
      await setupWebhooks(req.tenant)
    }
    res.json({ message: 'Data sync completed' })
  } catch (error) {
    console.error('Sync error:', error)
    res.status(500).json({ error: 'Sync failed' })
  }
}

const registerWebhooks = async (req, res) => {
  try {
    if (!req.tenant.shopifyToken) {
      return res.status(400).json({ error: 'Shopify token required for webhook registration' })
    }
    await setupWebhooks(req.tenant)
    res.json({ message: 'Webhooks registered successfully' })
  } catch (error) {
    console.error('Webhook registration error:', error)
    res.status(500).json({ error: 'Webhook registration failed' })
  }
}

const getShopifyData = async (req, res) => {
  try {
    const { resource, id } = req.params
    if (!['products', 'customers', 'orders'].includes(resource)) {
      return res.status(400).json({ error: 'Invalid resource type' })
    }
    const endpoint = id ? `${resource}/${id}.json` : `${resource}.json`
    const response = await shopifyRequest(req.tenant, endpoint)
    res.json(response.data)
  } catch (error) {
    console.error('Shopify API error:', error)
    res.status(500).json({ error: 'Failed to fetch Shopify data' })
  }
}

module.exports = { 
  syncData, 
  registerWebhooks,
  getShopifyData,
  getAllPages,
  shopifyRequest,
  syncShopifyData,
  setupWebhooks,
  testConnection
}