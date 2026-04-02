import { requireAdminAuth } from '../../lib/admin-auth.js';
import { queryMany } from '../../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminAuth(req, res)) return;

  try {
    const products = await queryMany(`
      SELECT
        item->>'id'   AS product_id,
        item->>'name' AS name,
        SUM((item->>'price')::numeric * (item->>'quantity')::int) AS revenue,
        SUM((item->>'quantity')::int) AS units
      FROM orders, jsonb_array_elements(items) AS item
      WHERE status NOT IN ('cancelled', 'refunded', 'failed')
      GROUP BY product_id, name
      ORDER BY revenue DESC
      LIMIT 5
    `);
    return res.status(200).json({ products: products || [] });
  } catch {
    return res.status(200).json({ products: [] });
  }
}
