require('dotenv').config();
const { syncShopifyData } = require('./src/services/shopify');

async function testFullSync() {
  try {
    console.log('🚀 Starting full Shopify sync test...');
    console.log(`Using domain: ${process.env.SHOPIFY_DOMAIN}`);
    console.log(`Using token: ${process.env.SHOPIFY_ACCESS_TOKEN?.substring(0, 10)}...`);
    
    // Test the full sync (it will use environment variables)
    await syncShopifyData();
    
    console.log('✅ Full sync completed successfully!');
  } catch (error) {
    console.error('❌ Full sync failed:', error.message);
    console.error(error);
  }
}

testFullSync();