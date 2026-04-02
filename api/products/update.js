import { requireAdminAuth } from '../../lib/admin-auth.js';
import { updateDbProduct } from '../../lib/db-store.js';

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminAuth(req, res)) return;

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'your_postgresql_connection_string_here') {
    return res.status(503).json({
      error: 'Product updates require PostgreSQL. Set a real DATABASE_URL first.',
    });
  }

  const { id, ...fields } = req.body || {};
  if (!id) return res.status(400).json({ error: 'Missing product id' });

  try {
    const product = await updateDbProduct(id, fields);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.status(200).json({ product });
  } catch (err) {
    console.error('update product error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
