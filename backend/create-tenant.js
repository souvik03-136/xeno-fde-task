require('dotenv').config();
const prisma = require('./src/models');

async function createUserAndTenant() {
  try {
    const user = await prisma.user.upsert({
      where: { email: 'admin@shopify-sync.com' },
      update: {
        updatedAt: new Date()
      },
      create: {
        email: 'admin@shopify-sync.com',
        password: 'temp-password-hash',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('User created/updated:', user.email);

    const tenant = await prisma.tenant.upsert({
      where: { shopifyDomain: process.env.SHOPIFY_DOMAIN },
      update: {
        name: process.env.SHOPIFY_DOMAIN || 'development-store',
        shopifyToken: process.env.SHOPIFY_ACCESS_TOKEN,
        updatedAt: new Date()
      },
      create: {
        name: process.env.SHOPIFY_DOMAIN || 'development-store',
        shopifyDomain: process.env.SHOPIFY_DOMAIN,
        shopifyToken: process.env.SHOPIFY_ACCESS_TOKEN,
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('Tenant created/updated:', tenant.name);
    console.log('Tenant ID:', tenant.id);
    console.log('Now update your sync to use tenant ID:', tenant.id);
    
    return tenant;
  } catch (error) {
    console.error('Error creating user/tenant:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUserAndTenant();