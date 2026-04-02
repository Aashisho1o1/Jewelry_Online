import { rateLimit } from '../../lib/rate-limiter.js';
import { getOrderById } from '../../lib/db-store.js';

const lookupRateLimit = rateLimit({ windowMs: 60 * 1000, max: 10 });

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('977') && digits.length > 10) digits = digits.slice(3);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await lookupRateLimit(req, res);
  if (!allowed) return;

  const { id, phone } = req.query;
  if (!id || typeof id !== 'string' || id.trim().length === 0 || !phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Order ID and phone number are required' });
  }

  const order = await getOrderById(id.trim());
  if (!order || normalizePhone(order.customer?.phone) !== normalizePhone(phone)) {
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
