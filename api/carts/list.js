import { requireAdminAuth } from '../../lib/admin-auth.js';
import { getAbandonedCarts } from '../../lib/db-store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
