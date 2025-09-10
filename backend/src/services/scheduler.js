const cron = require('node-cron');
const prisma = require('../models');

const syncAllTenants = async () => {
  try {
    console.log('Starting scheduled sync for all tenants');
    
    const tenants = await prisma.tenant.findMany({
      where: {
        shopifyToken: { not: null }
      }
    });
    
    for (const tenant of tenants) {
      try {
        console.log(`Syncing data for tenant: ${tenant.name}`);
        await syncShopifyData(tenant);
        console.log(`Successfully synced data for tenant: ${tenant.name}`);
      } catch (error) {
        console.error(`Error syncing data for tenant ${tenant.name}:`, error.message);
      }
    }
    
    console.log('Completed scheduled sync for all tenants');
  } catch (error) {
    console.error('Error in scheduled sync:', error);
  }
};

const setupScheduler = () => {
  cron.schedule('0 2 * * *', syncAllTenants);
  console.log('Scheduler setup: Daily sync at 2 AM');
};

module.exports = { setupScheduler, syncAllTenants };