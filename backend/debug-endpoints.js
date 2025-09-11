require('dotenv').config();
const axios = require('axios');

async function debugEndpoints() {
  const domain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const baseUrl = `https://${domain}/admin/api/2023-10`;
  
  console.log('🔍 Debugging individual endpoints...');
  console.log(`Domain: ${domain}`);
  console.log(`Token: ${token?.substring(0, 10)}...`);
  
  // Test different endpoint formats
  const endpointsToTest = [
    'products.json',
    'products.json?limit=10',
    'products.json?limit=250',
    'products.json?limit=250&page=1',
    'customers.json',
    'customers.json?limit=10', 
    'orders.json',
    'orders.json?limit=10'
  ];
  
  for (const endpoint of endpointsToTest) {
    try {
      console.log(`\n🧪 Testing: ${baseUrl}/${endpoint}`);
      
      const response = await axios.get(`${baseUrl}/${endpoint}`, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      const data = response.data;
      const resourceKey = Object.keys(data).find(key => Array.isArray(data[key]));
      const count = resourceKey ? data[resourceKey].length : 0;
      
      console.log(`✅ Success! Found ${count} items`);
      
      // Show first item as example
      if (count > 0 && data[resourceKey][0]) {
        const item = data[resourceKey][0];
        if (resourceKey === 'products') {
          console.log(`   📦 Sample: "${item.title}" (ID: ${item.id})`);
        } else if (resourceKey === 'customers') {
          console.log(`   👤 Sample: "${item.first_name} ${item.last_name}" (${item.email})`);
        } else if (resourceKey === 'orders') {
          console.log(`   📋 Sample: Order #${item.order_number} ($${item.total_price})`);
        }
      }
      
    } catch (error) {
      console.log(`❌ Failed: ${error.response?.status} - ${error.response?.statusText}`);
      if (error.response?.data && error.response.data !== 'Bad Request') {
        console.log(`   Details: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  // Test cursor-based pagination (newer Shopify API style)
  console.log('\n🔍 Testing cursor-based pagination...');
  try {
    const response = await axios.get(`${baseUrl}/products.json?limit=10&page_info=`, {
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    console.log('✅ Cursor-based pagination works!');
  } catch (error) {
    console.log(`❌ Cursor-based failed: ${error.response?.status}`);
  }
}

debugEndpoints();