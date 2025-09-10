const prisma = require('../models');

const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.tenant.id;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.orderDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const [
      totalCustomers,
      totalOrders,
      totalRevenue,
      ordersByDate,
      topCustomers
    ] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      
      prisma.order.count({
        where: { tenantId, ...dateFilter }
      }),
      
      prisma.order.aggregate({
        where: { tenantId, ...dateFilter },
        _sum: { totalPrice: true }
      }),
      
      prisma.order.groupBy({
        by: ['orderDate'],
        where: { tenantId, ...dateFilter },
        _count: { id: true },
        _sum: { totalPrice: true },
        orderBy: { orderDate: 'asc' }
      }),
      
      prisma.customer.findMany({
        where: { tenantId },
        orderBy: { totalSpent: 'desc' },
        take: 5,
        select: {
          firstName: true,
          lastName: true,
          email: true,
          totalSpent: true
        }
      })
    ]);

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      ordersByDate: ordersByDate.map(item => ({
        date: item.orderDate.toISOString().split('T')[0],
        orders: item._count.id,
        revenue: item._sum.totalPrice || 0
      })),
      topCustomers
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getDashboardStats };