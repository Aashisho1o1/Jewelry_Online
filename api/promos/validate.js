import { rateLimit } from '../../lib/rate-limiter.js';
import { getPromo } from '../../lib/db-store.js';

const limiter = rateLimit({ windowMs: 60_000, max: 5, message: 'Too many promo attempts. Please wait.' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await limiter(req, res);
  if (!allowed) return;

  const { code, subtotal } = req.body || {};

  if (!code || typeof code !== 'string') {
    return res.status(200).json({ valid: false, error: 'Please enter a promo code.' });
  }

  const parsedSubtotal = Number(subtotal);
  if (!Number.isFinite(parsedSubtotal) || parsedSubtotal <= 0) {
    return res.status(200).json({ valid: false, error: 'Invalid subtotal.' });
  }

  try {
    const promo = await getPromo(code.trim());

    if (!promo) {
      return res.status(200).json({ valid: false, error: 'This code is not valid.' });
    }

    if (!promo.active) {
      return res.status(200).json({ valid: false, error: 'This code is no longer active.' });
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(200).json({ valid: false, error: 'This code has expired.' });
    }

    if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
      return res.status(200).json({ valid: false, error: 'This code has reached its usage limit.' });
    }

    const minOrder = parseFloat(promo.min_order_amount) || 0;
    if (parsedSubtotal < minOrder) {
      return res.status(200).json({
        valid: false,
        error: `This code requires a minimum order of NPR ${minOrder.toLocaleString()}.`,
      });
    }

    const discountValue = parseFloat(promo.discount_value);
    let discountAmount;
    if (promo.discount_type === 'percent') {
      discountAmount = Math.round(parsedSubtotal * discountValue / 100);
    } else {
      discountAmount = Math.min(discountValue, parsedSubtotal);
    }

    return res.status(200).json({
      valid: true,
      code: promo.code,
      discountType: promo.discount_type,
      discountValue,
      description: promo.description || null,
      discountAmount,
    });
  } catch (err) {
    console.error('Promo validate error:', err);
    return res.status(500).json({ valid: false, error: 'Could not validate code. Please try again.' });
  }
}
