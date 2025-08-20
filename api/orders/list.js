import { getRecentOrders, getOrderStats } from '../../lib/db-store';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { limit = 20 } = req.query;

    // For MVP, just get recent orders (keeps it simple and fast)
    const orders = await getRecentOrders(parseInt(limit));

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
