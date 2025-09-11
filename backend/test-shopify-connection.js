const axios = require('axios');

async function testConnection() {
  const shopifyDomain = 'shoplytics-demo-store.myshopify.com';
  
  // Replace this with your actual Admin API access token when you find it
  const accessToken = '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'; // Should start with shpat_
  
  // Your API credentials (for reference)
  const apiKey = '11c6c30a65409b11c11246cd5a5be6ca';
  const apiSecret = '2af6b0d845f6e12f3a346b31797402f8';

  console.log('🔍 Debug Information:');
  console.log(`Domain: ${shopifyDomain}`);
  console.log(`API Key: ${apiKey}`);
  console.log(`API Secret: ${apiSecret.substring(0, 8)}...`);
  console.log(`Access Token: ${accessToken}`);
  console.log('');

  // Test 1: Try with access token (if provided)
  if (accessToken && accessToken !== 'REPLACE_WITH_ADMIN_API_ACCESS_TOKEN') {
    try {
      console.log('🧪 Test 1: Using Admin API access token...');
      const response = await axios.get(
        `https://${shopifyDomain}/admin/api/2023-10/shop.json`, // Simple endpoint
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('✅ Access token works!');
      console.log(`Shop: ${response.data.shop.name}`);
      return true;
    } catch (error) {
      console.log('❌ Access token failed:', error.response?.status, error.response?.data?.errors);
    }
  } else {
    console.log('⚠️  No access token provided, skipping Test 1');
  }

  // Test 2: Try basic auth with API key/secret
  try {
    console.log('🧪 Test 2: Using API key/secret with basic auth...');
    const response = await axios.get(
      `https://${shopifyDomain}/admin/api/2023-10/shop.json`,
      {
        auth: {
          username: apiKey,
          password: apiSecret
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ API key/secret works!');
    console.log(`Shop: ${response.data.shop.name}`);
    return true;
  } catch (error) {
    console.log('❌ API key/secret failed:', error.response?.status, error.response?.data?.errors);
  }

  // Test 3: Try different API version
  try {
    console.log('🧪 Test 3: Trying older API version...');
    const response = await axios.get(
      `https://${shopifyDomain}/admin/api/2022-10/shop.json`,
      {
        auth: {
          username: apiKey,
          password: apiSecret
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    console.log('✅ Older API version works!');
    console.log(`Shop: ${response.data.shop.name}`);
    return true;
  } catch (error) {
    console.log('❌ Older API version failed:', error.response?.status, error.response?.data?.errors);
  }

  console.log('\n💡 Next steps:');
  console.log('1. Go to Shopify Admin → Settings → Apps and sales channels → Develop apps');
  console.log('2. Click on your app');
  console.log('3. Go to API credentials tab');
  console.log('4. Look for "Admin API access token" (starts with shpat_)');
  console.log('5. If you don\'t see it, click "Install app" button');
  console.log('6. Copy the access token and replace REPLACE_WITH_ADMIN_API_ACCESS_TOKEN in this file');

  return false;
}

testConnection();