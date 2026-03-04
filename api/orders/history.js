import { rateLimit } from '../../lib/rate-limiter.js';
import { queryMany } from '../../lib/db.js';

const limiter = rateLimit({ windowMs: 60000, max: 3, message: 'Too many requests. Please wait a moment.' });

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const allowed = await limiter(req, res);
  if (!allowed) return;

  const { phone } = req.query;
  if (!phone || phone.length < 7 || phone.length > 15) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }

  try {
    const orders = await queryMany(
      `SELECT id, total, status, payment_method, items, created_at
       FROM orders
       WHERE customer->>'phone' = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [phone]
    );

    const parsed = (orders || []).map(o => ({
      ...o,
      items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
    }));

    return res.status(200).json({ orders: parsed });
  } catch (err) {
    console.error('Order history error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
