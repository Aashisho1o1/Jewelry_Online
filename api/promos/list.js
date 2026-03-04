import { requireAdminAuth } from '../../lib/admin-auth.js';
import { queryMany } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireAdminAuth(req, res)) return;

  try {
    const promos = await queryMany('SELECT * FROM promos ORDER BY created_at DESC');
    return res.status(200).json({ promos });
  } catch (err) {
    console.error('Promo list error:', err);
    return res.status(500).json({ error: 'Failed to fetch promos.' });
  }
}
