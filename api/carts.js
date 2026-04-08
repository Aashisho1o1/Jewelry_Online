/**
 * Consolidated carts handler.
 *
 * POST /api/carts/save
 * GET  /api/carts/list
 * POST /api/carts/mark-recovered
 */

import { rateLimit } from '../lib/rate-limiter.js';
import { requireAdminAuth } from '../lib/admin-auth.js';
import { saveAbandonedCart, getAbandonedCarts, markCartRecovered } from '../lib/db-store.js';

const saveLimiter = rateLimit({ windowMs: 60_000, max: 3, message: 'Too many requests.' });

function randomHex(n) { return Math.random().toString(16).slice(2, 2 + n); }

function getAction(req) {
  const pathname = req.url.split('?')[0];
  const match = pathname.match(/\/carts\/(.+)$/);
  return match ? match[1] : '';
}

export default async function handler(req, res) {
  const action = getAction(req);

  // POST /api/carts/save
  if (action === 'save') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const allowed = await saveLimiter(req, res);
    if (!allowed) return;
    const { name, phone, items, subtotal } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'No items provided.' });
    const parsedSubtotal = Number(subtotal);
    if (!Number.isFinite(parsedSubtotal) || parsedSubtotal <= 0) return res.status(400).json({ error: 'Invalid subtotal.' });
    const id = `CART-${Date.now()}-${randomHex(4)}`;
    try {
      await saveAbandonedCart({ id, name: name ? String(name).trim().slice(0, 100) : null, phone: phone ? String(phone).trim().slice(0, 20) : null, items, subtotal: parsedSubtotal });
      return res.status(200).json({ id });
    } catch (err) {
      console.error('Cart save error:', err);
      return res.status(500).json({ error: 'Failed to save cart.' });
    }
  }

  // GET /api/carts/list (admin)
  if (action === 'list') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    try {
      const days = parseInt(req.query?.days) || 14;
      const carts = await getAbandonedCarts(days);
      return res.status(200).json({ carts });
    } catch (err) {
      console.error('Cart list error:', err);
      return res.status(500).json({ error: 'Failed to fetch carts.' });
    }
  }

  // POST /api/carts/mark-recovered (admin)
  if (action === 'mark-recovered') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'id is required.' });
    try {
      await markCartRecovered(id);
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Mark recovered error:', err);
      return res.status(500).json({ error: 'Failed to mark cart as recovered.' });
    }
  }

  return res.status(404).json({ error: 'Unknown carts endpoint' });
}
