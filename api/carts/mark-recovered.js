import { requireAdminAuth } from '../../lib/admin-auth.js';
import { markCartRecovered } from '../../lib/db-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireAdminAuth(req, res)) return;

  const { id } = req.body || {};
  if (!id) {
    return res.status(400).json({ error: 'id is required.' });
  }

  try {
    await markCartRecovered(id);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Mark recovered error:', err);
    return res.status(500).json({ error: 'Failed to mark cart as recovered.' });
  }
}
