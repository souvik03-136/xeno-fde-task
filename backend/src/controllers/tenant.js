const prisma = require('../models');

const createTenant = async (req, res) => {
  try {
    const { name, shopifyDomain, shopifyToken } = req.body;

    const tenant = await prisma.tenant.create({
      data: {
        name,
        shopifyDomain,
        shopifyToken,
        userId: req.user.id
      }
    });

    res.status(201).json(tenant);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getTenants = async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany({
      where: { userId: req.user.id }
    });

    res.json(tenants);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { createTenant, getTenants };