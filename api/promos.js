/**
 * Consolidated promos handler.
 *
 * GET    /api/promos/list
 * POST   /api/promos/create
 * DELETE /api/promos/delete
 * POST   /api/promos/toggle
 * POST   /api/promos/validate
 */

import { requireAdminAuth } from '../lib/admin-auth.js';
import { rateLimit } from '../lib/rate-limiter.js';
import { query, queryMany } from '../lib/db.js';
import { getPromo } from '../lib/db-store.js';

const validateLimiter = rateLimit({ windowMs: 60_000, max: 5, message: 'Too many promo attempts. Please wait.' });

function getAction(req) {
  const pathname = req.url.split('?')[0];
  const match = pathname.match(/\/promos\/(.+)$/);
  return match ? match[1] : '';
}

export default async function handler(req, res) {
  const action = getAction(req);

  // GET /api/promos/list (admin)
  if (action === 'list') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    try {
      const promos = await queryMany('SELECT * FROM promos ORDER BY created_at DESC');
      return res.status(200).json({ promos });
    } catch (err) {
      console.error('Promo list error:', err);
      return res.status(500).json({ error: 'Failed to fetch promos.' });
    }
  }

  // POST /api/promos/create (admin)
  if (action === 'create') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    const { code, description, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = req.body || {};
    if (!code || typeof code !== 'string' || code.trim().length < 2) return res.status(400).json({ error: 'Code must be at least 2 characters.' });
    if (!['percent', 'fixed'].includes(discountType)) return res.status(400).json({ error: 'discountType must be "percent" or "fixed".' });
    const value = Number(discountValue);
    if (!Number.isFinite(value) || value <= 0) return res.status(400).json({ error: 'discountValue must be a positive number.' });
    if (discountType === 'percent' && value > 100) return res.status(400).json({ error: 'Percent discount cannot exceed 100.' });
    try {
      const promo = await query(`INSERT INTO promos (code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at) VALUES (UPPER($1), $2, $3, $4, $5, $6, $7) RETURNING *`, [code.trim(), description || null, discountType, value, Number(minOrderAmount) || 0, maxUses ? parseInt(maxUses) : null, expiresAt || null]);
      return res.status(201).json({ success: true, promo });
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'A promo with this code already exists.' });
      console.error('Promo create error:', err);
      return res.status(500).json({ error: 'Failed to create promo.' });
    }
  }

  // DELETE /api/promos/delete (admin)
  if (action === 'delete') {
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    try {
      const { id } = req.body ?? {};
      if (!id) return res.status(400).json({ error: 'id required' });
      await query('DELETE FROM promos WHERE id = $1', [id]);
      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /api/promos/toggle (admin)
  if (action === 'toggle') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    try {
      const { id, active } = req.body ?? {};
      if (id == null) return res.status(400).json({ error: 'id required' });
      const promo = await query('UPDATE promos SET active = $1 WHERE id = $2 RETURNING *', [!!active, id]);
      return res.status(200).json({ success: true, promo });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST /api/promos/validate (public)
  if (action === 'validate') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const allowed = await validateLimiter(req, res);
    if (!allowed) return;
    const { code, subtotal } = req.body || {};
    if (!code || typeof code !== 'string') return res.status(200).json({ valid: false, error: 'Please enter a promo code.' });
    const parsedSubtotal = Number(subtotal);
    if (!Number.isFinite(parsedSubtotal) || parsedSubtotal <= 0) return res.status(200).json({ valid: false, error: 'Invalid subtotal.' });
    try {
      const promo = await getPromo(code.trim());
      if (!promo) return res.status(200).json({ valid: false, error: 'This code is not valid.' });
      if (!promo.active) return res.status(200).json({ valid: false, error: 'This code is no longer active.' });
      if (promo.expires_at && new Date(promo.expires_at) < new Date()) return res.status(200).json({ valid: false, error: 'This code has expired.' });
      if (promo.max_uses !== null && promo.used_count >= promo.max_uses) return res.status(200).json({ valid: false, error: 'This code has reached its usage limit.' });
      const minOrder = parseFloat(promo.min_order_amount) || 0;
      if (parsedSubtotal < minOrder) return res.status(200).json({ valid: false, error: `This code requires a minimum order of NPR ${minOrder.toLocaleString()}.` });
      const discountValue = parseFloat(promo.discount_value);
      const discountAmount = promo.discount_type === 'percent' ? Math.round(parsedSubtotal * discountValue / 100) : Math.min(discountValue, parsedSubtotal);
      return res.status(200).json({ valid: true, code: promo.code, discountType: promo.discount_type, discountValue, description: promo.description || null, discountAmount });
    } catch (err) {
      console.error('Promo validate error:', err);
      return res.status(500).json({ valid: false, error: 'Could not validate code. Please try again.' });
    }
  }

  return res.status(404).json({ error: 'Unknown promos endpoint' });
}
