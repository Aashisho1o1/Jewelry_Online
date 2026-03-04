import { requireAdminAuth } from '../../lib/admin-auth.js';
import { queryMany } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminAuth(req, res)) return;

  try {
    const days = await queryMany(`
      SELECT
        DATE(created_at AT TIME ZONE 'Asia/Kathmandu') AS day,
        COUNT(*)::int AS orders,
        COALESCE(SUM(total), 0)::numeric AS revenue
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '30 days'
        AND status NOT IN ('cancelled', 'refunded', 'failed')
      GROUP BY day
      ORDER BY day
    `);
    return res.status(200).json({ days: days || [] });
  } catch {
    return res.status(200).json({ days: [] });
  }
}
