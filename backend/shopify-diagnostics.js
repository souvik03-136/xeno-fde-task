require('dotenv').config();
const axios = require('axios');

async function runDiagnostics() {
  const domain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  
  console.log('=== SHOPIFY API DIAGNOSTICS ===');
  console.log(`Domain: ${domain}`);
  console.log(`Token: ${token?.substring(0, 15)}...`);
  console.log('');

  // Test different API versions
  const apiVersions = ['2023-10', '2023-07', '2023-04', '2023-01', '2022-10'];
  
  for (const version of apiVersions) {
    console.log(`Testing API version: ${version}`);
    
    try {
      const response = await axios.get(
        `https://${domain}/admin/api/${version}/shop.json`,
        {
          headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log(`✅ API version ${version} works!`);
      console.log(`   Shop: ${response.data.shop.name}`);
      console.log(`   Plan: ${response.data.shop.plan_name}`);
      
      // Test available endpoints with this working version
      await testEndpointsWithVersion(domain, token, version);
      break;
      
    } catch (error) {
      console.log(`❌ API version ${version} failed: ${error.response?.status} - ${error.response?.statusText}`);
      if (error.response?.data && typeof error.response.data === 'object') {
        console.log(`   Error: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
  
  // Test token validity with different methods
  console.log('\n=== TOKEN VALIDATION TESTS ===');
  await testTokenMethods(domain, token);
}

async function testEndpointsWithVersion(domain, token, version) {
  console.log(`\n=== TESTING ENDPOINTS WITH API VERSION ${version} ===`);
  
  const endpoints = [
    { name: 'shop', url: 'shop.json', scope: 'basic' },
    { name: 'customers', url: 'customers.json?limit=1', scope: 'read_customers' },
    { name: 'products', url: 'products.json?limit=1', scope: 'read_products' },
    { name: 'orders', url: 'orders.json?limit=1', scope: 'read_orders' },
    { name: 'webhooks', url: 'webhooks.json', scope: 'basic' }
  ];
  
  const workingEndpoints = [];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(
        `https://${domain}/admin/api/${version}/${endpoint.url}`,
        {
          headers: {
            'X-Shopify-Access-Token': token,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log(`✅ ${endpoint.name}: Working (${endpoint.scope})`);
      workingEndpoints.push(endpoint.name);
      
      // Show sample data
      const data = response.data;
      const resourceKey = Object.keys(data).find(key => Array.isArray(data[key]));
      if (resourceKey && data[resourceKey].length > 0) {
        console.log(`   Found ${data[resourceKey].length} items`);
      }
      
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.errors || error.response?.statusText;
      
      if (status === 403) {
        console.log(`❌ ${endpoint.name}: No permission (needs ${endpoint.scope})`);
      } else {
        console.log(`❌ ${endpoint.name}: Failed (${status}) - ${message}`);
      }
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log(`\nWorking endpoints: ${workingEndpoints.join(', ')}`);
  return { version, workingEndpoints };
}

async function testTokenMethods(domain, token) {
  // Test 1: Direct token header
  console.log('Test 1: X-Shopify-Access-Token header');
  try {
    const response = await axios.get(`https://${domain}/admin/api/2023-10/shop.json`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    console.log('✅ Token header method works');
  } catch (error) {
    console.log(`❌ Token header failed: ${error.response?.status}`);
  }
  
  // Test 2: Authorization header
  console.log('Test 2: Authorization Bearer header');
  try {
    const response = await axios.get(`https://${domain}/admin/api/2023-10/shop.json`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('✅ Bearer token method works');
  } catch (error) {
    console.log(`❌ Bearer token failed: ${error.response?.status}`);
  }
  
  // Test 3: Token validation endpoint
  console.log('Test 3: Token info endpoint');
  try {
    const response = await axios.get(`https://${domain}/admin/oauth/access_scopes.json`, {
      headers: { 'X-Shopify-Access-Token': token }
    });
    console.log('✅ Token info accessible');
    console.log(`   Scopes: ${response.data.access_scopes.map(s => s.handle).join(', ')}`);
  } catch (error) {
    console.log(`❌ Token info failed: ${error.response?.status}`);
  }
}

async function generateWorkingConfig() {
  console.log('\n=== GENERATING WORKING CONFIGURATION ===');
  
  const domain = process.env.SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  
  // Find working API version
  let workingVersion = null;
  const versions = ['2023-10', '2023-07', '2023-04', '2023-01', '2022-10'];
  
  for (const version of versions) {
    try {
      await axios.get(`https://${domain}/admin/api/${version}/shop.json`, {
        headers: { 'X-Shopify-Access-Token': token },
        timeout: 5000
      });
      workingVersion = version;
      break;
    } catch (error) {
      continue;
    }
  }
  
  if (!workingVersion) {
    console.log('❌ No working API version found');
    return;
  }
  
  console.log(`✅ Working API version: ${workingVersion}`);
  
  // Test endpoints
  const endpoints = ['customers.json', 'products.json', 'orders.json'];
  const working = [];
  
  for (const endpoint of endpoints) {
    try {
      await axios.get(`https://${domain}/admin/api/${workingVersion}/${endpoint}?limit=1`, {
        headers: { 'X-Shopify-Access-Token': token },
        timeout: 5000
      });
      working.push(endpoint.replace('.json', ''));
    } catch (error) {
      // Endpoint not available
    }
  }
  
  console.log(`✅ Available endpoints: ${working.join(', ')}`);
  
  // Generate .env update
  console.log('\n=== RECOMMENDED .ENV UPDATES ===');
  console.log(`SHOPIFY_API_VERSION=${workingVersion}`);
  console.log(`SHOPIFY_AVAILABLE_ENDPOINTS=${working.join(',')}`);
  
  return { version: workingVersion, endpoints: working };
}

// Run all diagnostics
runDiagnostics()
  .then(() => generateWorkingConfig())
  .then(() => {
    console.log('\n=== DIAGNOSTICS COMPLETE ===');
    console.log('Use the information above to update your Shopify service configuration.');
  })
  .catch(error => {
    console.error('Diagnostics failed:', error.message);
  });