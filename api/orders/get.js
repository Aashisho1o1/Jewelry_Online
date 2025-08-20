import { getOrderById } from './store';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Validate order ID
    if (!id) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get order from store
    const order = getOrderById(id);

    // Return 404 if order not found
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Return order details
    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Order retrieval error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
