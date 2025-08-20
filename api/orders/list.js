import { getAllOrders, getOrdersByStatus, getOrdersByCustomerPhone } from '../../lib/order-store';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { status, phone } = req.query;

    let orders;

    // Filter by status if provided
    if (status) {
      orders = getOrdersByStatus(status);
    }
    // Filter by customer phone if provided
    else if (phone) {
      orders = getOrdersByCustomerPhone(phone);
    }
    // Otherwise, get all orders
    else {
      orders = getAllOrders();
    }

    // Sort orders by creation date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Return orders
    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    console.error('Order listing error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
