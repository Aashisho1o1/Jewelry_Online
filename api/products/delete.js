import { requireAdminAuth } from '../../lib/admin-auth.js';
import { deleteDbProduct } from '../../lib/db-store.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminAuth(req, res)) return;

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'your_postgresql_connection_string_here') {
    return res.status(503).json({
      error: 'Product deletion requires PostgreSQL. Set a real DATABASE_URL first.',
    });
  }

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing product id' });

  try {
    await deleteDbProduct(id);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('delete product error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
