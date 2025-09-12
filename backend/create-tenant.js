require('dotenv').config();
const prisma = require('./src/models');

async function createTenant() {
  try {
    const domain = process.env.SHOPIFY_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!domain || !token) {
      console.error('Missing required environment variables: SHOPIFY_DOMAIN and SHOPIFY_ACCESS_TOKEN');
      process.exit(1);
    }

    let user = await prisma.user.findFirst({
      where: { email: 'admin@test.com' }
    });

    if (!user) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      user = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          password: hashedPassword
        }
      });
      console.log('Created default user: admin@test.com / password123');
    }

    const existingTenant = await prisma.tenant.findFirst({
      where: { shopifyDomain: domain }
    });

    if (existingTenant) {
      console.log('Tenant already exists:', existingTenant);
      return;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name: domain.replace('.myshopify.com', ''),
        shopifyDomain: domain,
        shopifyToken: token,
        userId: user.id
      }
    });

    console.log('Tenant created successfully:', tenant);

  } catch (error) {
    console.error('Error creating tenant:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTenant();