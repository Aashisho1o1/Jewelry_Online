import { rateLimit } from '../../lib/rate-limiter.js';
import { getOrderById } from '../../lib/db-store.js';

const lookupRateLimit = rateLimit({ windowMs: 60 * 1000, max: 10 });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await lookupRateLimit(req, res);
  if (!allowed) return;

  const { id } = req.query;
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  const order = await getOrderById(id.trim());
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  // Return safe public fields only - no full address, no phone number
  return res.status(200).json({
    id: order.id,
    status: order.status,
    items: order.items,
    total: order.total,
    paymentMethod: order.payment_method || order.paymentMethod,
    createdAt: order.created_at || order.createdAt,
  });
}
