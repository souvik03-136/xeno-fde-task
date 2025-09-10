const prisma = require('../models');

const handleOrderCreate = async (orderData, tenant) => {
  try {
    let customer = await prisma.customer.findFirst({
      where: {
        shopifyId: orderData.customer?.id?.toString(),
        tenantId: tenant.id
      }
    });
    
    if (!customer && orderData.customer) {
      customer = await prisma.customer.create({
        data: {
          shopifyId: orderData.customer.id.toString(),
          email: orderData.customer.email,
          firstName: orderData.customer.first_name,
          lastName: orderData.customer.last_name,
          tenantId: tenant.id
        }
      });
    }
    
    if (!customer) return;
    
    const createdOrder = await prisma.order.upsert({
      where: {
        shopifyId_tenantId: {
          shopifyId: orderData.id.toString(),
          tenantId: tenant.id
        }
      },
      update: {
        orderNumber: orderData.order_number.toString(),
        totalPrice: parseFloat(orderData.total_price || 0),
        orderDate: new Date(orderData.created_at),
        customerId: customer.id
      },
      create: {
        shopifyId: orderData.id.toString(),
        orderNumber: orderData.order_number.toString(),
        totalPrice: parseFloat(orderData.total_price || 0),
        orderDate: new Date(orderData.created_at),
        customerId: customer.id,
        tenantId: tenant.id
      }
    });
    
    for (const lineItem of orderData.line_items || []) {
      let product = await prisma.product.findFirst({
        where: {
          shopifyId: lineItem.product_id?.toString(),
          tenantId: tenant.id
        }
      });
      
      if (!product && lineItem.product_id) {
        product = await prisma.product.create({
          data: {
            shopifyId: lineItem.product_id.toString(),
            title: lineItem.title,
            price: parseFloat(lineItem.price || 0),
            tenantId: tenant.id
          }
        });
      }
      
      if (product) {
        await prisma.orderItem.upsert({
          where: {
            id: `${createdOrder.id}-${lineItem.id}`
          },
          update: {
            quantity: lineItem.quantity,
            price: parseFloat(lineItem.price)
          },
          create: {
            id: `${createdOrder.id}-${lineItem.id}`,
            quantity: lineItem.quantity,
            price: parseFloat(lineItem.price),
            orderId: createdOrder.id,
            productId: product.id
          }
        });
      }
    }
    
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        totalSpent: { increment: parseFloat(orderData.total_price || 0) },
        ordersCount: { increment: 1 }
      }
    });
  } catch (error) {
    console.error('Order webhook error:', error);
  }
};

const handleCustomerCreate = async (customerData, tenant) => {
  try {
    await prisma.customer.upsert({
      where: {
        shopifyId_tenantId: {
          shopifyId: customerData.id.toString(),
          tenantId: tenant.id
        }
      },
      update: {
        email: customerData.email,
        firstName: customerData.first_name,
        lastName: customerData.last_name
      },
      create: {
        shopifyId: customerData.id.toString(),
        email: customerData.email,
        firstName: customerData.first_name,
        lastName: customerData.last_name,
        tenantId: tenant.id
      }
    });
  } catch (error) {
    console.error('Customer webhook error:', error);
  }
};

const handleCartUpdate = async (cartData, tenant) => {
  try {
    if (cartData.abandoned_checkout_url) {
      let customer = null;
      
      if (cartData.customer) {
        customer = await prisma.customer.findFirst({
          where: {
            shopifyId: cartData.customer.id.toString(),
            tenantId: tenant.id
          }
        });
        
        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              shopifyId: cartData.customer.id.toString(),
              email: cartData.customer.email,
              firstName: cartData.customer.first_name,
              lastName: cartData.customer.last_name,
              tenantId: tenant.id
            }
          });
        }
      }
      
      await prisma.event.create({
        data: {
          type: 'cart_abandoned',
          customerId: customer?.id,
          tenantId: tenant.id,
          data: {
            cart: cartData,
            abandonedAt: new Date().toISOString()
          }
        }
      });
    }
  } catch (error) {
    console.error('Cart webhook error:', error);
  }
};

module.exports = {
  handleOrderCreate,
  handleCustomerCreate,
  handleCartUpdate
};