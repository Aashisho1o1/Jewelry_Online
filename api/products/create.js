import { requireAdminAuth } from '../../lib/admin-auth.js';
import { createDbProduct } from '../../lib/db-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminAuth(req, res)) return;

  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === 'your_postgresql_connection_string_here') {
    return res.status(503).json({
      error: 'Product creation requires PostgreSQL. Set a real DATABASE_URL first.',
    });
  }

  const { id, name, category, material, price } = req.body || {};
  if (!id || !name || !category || !material || !price) {
    return res.status(400).json({ error: 'Missing required fields: id, name, category, material, price' });
  }

  // Validate id is a safe slug
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).json({ error: 'Product ID must contain only letters, numbers, hyphens, and underscores' });
  }

  try {
    const product = await createDbProduct(req.body);
    return res.status(201).json({ product });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: `A product with ID "${id}" already exists` });
    }
    console.error('create product error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
