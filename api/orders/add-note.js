import { requireAdminAuth } from '../../lib/admin-auth.js';
import { query } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminAuth(req, res)) return;

  try {
    const { orderId, note } = req.body ?? {};
    if (!orderId) return res.status(400).json({ error: 'orderId required' });
    await query('UPDATE orders SET notes = $1 WHERE id = $2', [note || null, orderId]);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save note' });
  }
}
