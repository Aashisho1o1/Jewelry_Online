import { requireAdminAuth } from '../../lib/admin-auth.js';
import { query } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminAuth(req, res)) return;

  try {
    const { id, active } = req.body ?? {};
    if (id == null) return res.status(400).json({ error: 'id required' });
    const promo = await query(
      'UPDATE promos SET active = $1 WHERE id = $2 RETURNING *',
      [!!active, id]
    );
    return res.status(200).json({ success: true, promo });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
