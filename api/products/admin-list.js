import { requireAdminAuth } from '../../lib/admin-auth.js';
import { getDbProducts } from '../../lib/db-store.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminAuth(req, res)) return;

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'your_postgresql_connection_string_here') {
    return res.status(200).json({
      products: [],
      warning: 'Database-backed products are unavailable until DATABASE_URL is configured.',
    });
  }

  try {
    const products = await getDbProducts();
    return res.status(200).json({ products: products || [] });
  } catch (err) {
    console.error('admin-list products error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
