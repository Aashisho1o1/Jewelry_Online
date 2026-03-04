import { requireAdminAuth } from '../../lib/admin-auth.js';
import { queryMany } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!requireAdminAuth(req, res)) return;

  try {
    const limit = Math.min(parseInt(req.query?.limit ?? '200', 10), 500);
    const orders = await queryMany(
      `SELECT id, items, customer, total, payment_method, status, notes, created_at
       FROM orders ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.status(200).json({ orders: orders || [] });
  } catch (error) {
    console.error('[orders/list] error:', error.message);
    return res.status(200).json({ orders: [] });
  }
}
