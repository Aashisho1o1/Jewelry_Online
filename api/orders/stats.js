import { requireAdminAuth } from '../../lib/admin-auth.js';
import { getOrderStats } from '../../lib/db-store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authorized = requireAdminAuth(req, res);
  if (!authorized) return;

  const byStatus = await getOrderStats();

  const totalOrders = Object.values(byStatus).reduce((sum, s) => sum + (s.count || 0), 0);
  const EXCLUDED = ['cancelled', 'refunded', 'failed'];
  const totalRevenue = Object.entries(byStatus)
    .filter(([status]) => !EXCLUDED.includes(status))
    .reduce((sum, [, s]) => sum + (parseFloat(s.revenue) || 0), 0);

  return res.status(200).json({ byStatus, totalOrders, totalRevenue });
}
