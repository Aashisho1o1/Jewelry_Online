import { updateOrderStatus, getOrderById } from '../../lib/db-store';
import { requireAdminAuth } from '../../lib/admin-auth';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireAdminAuth(req, res)) return;

  try {
    const { id, status } = req.body;

    // Validate required fields
    if (!id || !status) {
      return res.status(400).json({ error: 'Order ID and status are required' });
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status',
        validStatuses
      });
    }

    // Check if order exists
    const existingOrder = await getOrderById(id);
    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status
    const updatedOrder = await updateOrderStatus(id, status);

    // Return updated order
    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });
  } catch (error) {
    console.error('Order status update error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
