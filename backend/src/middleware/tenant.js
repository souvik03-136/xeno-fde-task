const prisma = require('../models');

const tenant = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID required' });
    }

    const tenantData = await prisma.tenant.findFirst({
      where: {
        id: tenantId,
        userId: req.user.id
      }
    });

    if (!tenantData) {
      return res.status(403).json({ error: 'Access denied to tenant' });
    }

    req.tenant = tenantData;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = tenant;