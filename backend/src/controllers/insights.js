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
      topCustomers,
      revenueByProduct,
      abandonedCarts
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
          totalSpent: true,
          ordersCount: true
        }
      }),
      
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            tenantId,
            ...dateFilter
          }
        },
        _sum: {
          price: true,
          quantity: true
        },
        orderBy: {
          _sum: {
            price: 'desc'
          }
        },
        take: 10
      }),
      
      prisma.event.count({
        where: {
          tenantId,
          type: 'cart_abandoned',
          createdAt: dateFilter.orderDate || {}
        }
      })
    ]);

    const productsWithDetails = await Promise.all(
      revenueByProduct.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { title: true }
        });
        
        return {
          product: product?.title || 'Unknown Product',
          revenue: item._sum.price * item._sum.quantity,
          quantity: item._sum.quantity
        };
      })
    );

    res.json({
      totalCustomers,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      ordersByDate: ordersByDate.map(item => ({
        date: item.orderDate.toISOString().split('T')[0],
        orders: item._count.id,
        revenue: item._sum.totalPrice || 0
      })),
      topCustomers,
      revenueByProduct: productsWithDetails,
      abandonedCarts
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAbandonedCarts = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const tenantId = req.tenant.id;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const abandonedCarts = await prisma.event.findMany({
      where: {
        tenantId,
        type: 'cart_abandoned',
        ...dateFilter
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(abandonedCarts);
  } catch (error) {
    console.error('Abandoned carts error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { 
  getDashboardStats, 
  getAbandonedCarts 
};