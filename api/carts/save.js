import { rateLimit } from '../../lib/rate-limiter.js';
import { saveAbandonedCart } from '../../lib/db-store.js';

const limiter = rateLimit({ windowMs: 60_000, max: 3, message: 'Too many requests.' });

function randomHex(n) {
  return Math.random().toString(16).slice(2, 2 + n);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await limiter(req, res);
  if (!allowed) return;

  const { name, phone, items, subtotal } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided.' });
  }

  const parsedSubtotal = Number(subtotal);
  if (!Number.isFinite(parsedSubtotal) || parsedSubtotal <= 0) {
    return res.status(400).json({ error: 'Invalid subtotal.' });
  }

  const id = `CART-${Date.now()}-${randomHex(4)}`;

  try {
    await saveAbandonedCart({
      id,
      name: name ? String(name).trim().slice(0, 100) : null,
      phone: phone ? String(phone).trim().slice(0, 20) : null,
      items,
      subtotal: parsedSubtotal,
    });
    return res.status(200).json({ id });
  } catch (err) {
    console.error('Cart save error:', err);
    return res.status(500).json({ error: 'Failed to save cart.' });
  }
}
