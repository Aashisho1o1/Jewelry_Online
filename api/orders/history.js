import { rateLimit } from '../../lib/rate-limiter.js';
import { getOrderById } from '../../lib/db-store.js';

const limiter = rateLimit({ windowMs: 60000, max: 3, message: 'Too many requests. Please wait a moment.' });

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('977') && digits.length > 10) digits = digits.slice(3);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const allowed = await limiter(req, res);
  if (!allowed) return;

  const { orderId, phone } = req.query;
  if (!orderId || typeof orderId !== 'string' || !phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Order ID and phone number are required' });
  }

  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length < 7 || normalizedPhone.length > 15) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  try {
    const order = await getOrderById(orderId.trim());
    if (!order || normalizePhone(order.customer?.phone) !== normalizedPhone) {
      return res.status(404).json({ orders: [] });
    }

    const parsed = [{
      id: order.id,
      total: order.total,
      status: order.status,
      payment_method: order.payment_method,
      items: order.items,
      created_at: order.created_at,
    }];

    return res.status(200).json({ orders: parsed });
  } catch (err) {
    console.error('Order history error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
