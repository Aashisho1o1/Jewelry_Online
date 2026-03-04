import { requireAdminAuth } from '../../lib/admin-auth.js';
import { query } from '../../lib/db.js';

export default async function handler(req, res) {
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
