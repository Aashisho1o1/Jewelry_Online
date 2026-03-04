import { requireAdminAuth } from '../../lib/admin-auth.js';
import { query } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireAdminAuth(req, res)) return;

  const { code, description, discountType, discountValue, minOrderAmount, maxUses, expiresAt } = req.body || {};

  if (!code || typeof code !== 'string' || code.trim().length < 2) {
    return res.status(400).json({ error: 'Code must be at least 2 characters.' });
  }

  if (!['percent', 'fixed'].includes(discountType)) {
    return res.status(400).json({ error: 'discountType must be "percent" or "fixed".' });
  }

  const value = Number(discountValue);
  if (!Number.isFinite(value) || value <= 0) {
    return res.status(400).json({ error: 'discountValue must be a positive number.' });
  }

  if (discountType === 'percent' && value > 100) {
    return res.status(400).json({ error: 'Percent discount cannot exceed 100.' });
  }

  try {
    const promo = await query(
      `INSERT INTO promos (code, description, discount_type, discount_value, min_order_amount, max_uses, expires_at)
       VALUES (UPPER($1), $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        code.trim(),
        description || null,
        discountType,
        value,
        Number(minOrderAmount) || 0,
        maxUses ? parseInt(maxUses) : null,
        expiresAt || null,
      ]
    );

    return res.status(201).json({ success: true, promo });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'A promo with this code already exists.' });
    }
    console.error('Promo create error:', err);
    return res.status(500).json({ error: 'Failed to create promo.' });
  }
}
