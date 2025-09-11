require('dotenv').config();
const { syncShopifyData } = require('./src/services/shopify');
const prisma = require('./src/models');

async function testSync() {
  console.log('Starting Shopify sync test...');
  console.log(`Domain: ${process.env.SHOPIFY_DOMAIN}`);
  console.log(`Token: ${process.env.SHOPIFY_ACCESS_TOKEN?.substring(0, 10)}...`);
  
  try {
    await syncShopifyData();
    
    console.log('\nChecking database records...');
    
    const customerCount = await prisma.customer.count();
    const productCount = await prisma.product.count();
    const orderCount = await prisma.order.count();
    const orderItemCount = await prisma.orderItem.count();
    
    console.log(`Customers synced: ${customerCount}`);
    console.log(`Products synced: ${productCount}`);
    console.log(`Orders synced: ${orderCount}`);
    console.log(`Order items synced: ${orderItemCount}`);
    
    if (customerCount > 0) {
      console.log('\nSample customer data:');
      const sampleCustomer = await prisma.customer.findFirst({
        select: {
          shopifyId: true,
          email: true,
          firstName: true,
          lastName: true,
          totalSpent: true,
          ordersCount: true
        }
      });
      console.log(sampleCustomer);
    }
    
    if (productCount > 0) {
      console.log('\nSample product data:');
      const sampleProduct = await prisma.product.findFirst({
        select: {
          shopifyId: true,
          title: true,
          price: true
        }
      });
      console.log(sampleProduct);
    }
    
    if (orderCount > 0) {
      console.log('\nSample order data:');
      const sampleOrder = await prisma.order.findFirst({
        select: {
          shopifyId: true,
          orderNumber: true,
          totalPrice: true,
          orderDate: true,
          customer: {
            select: {
              email: true,
              firstName: true
            }
          }
        }
      });
      console.log(sampleOrder);
    }
    
    console.log('\nSync test completed successfully!');
    
  } catch (error) {
    console.error('Sync test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testSync();