import { requireAdminAuth } from '../lib/admin-auth.js';
import { getInventory, updateProductStock } from '../lib/db-store.js';

export default async function handler(req, res) {
  if (!requireAdminAuth(req, res)) return;

  if (req.method === 'GET') {
    try {
      const rows = await getInventory();
      return res.status(200).json({ inventory: rows });
    } catch (err) {
      console.error('Inventory fetch error:', err);
      return res.status(500).json({ error: 'Failed to fetch inventory.' });
    }
  }

  if (req.method === 'POST') {
    const { productId, quantity } = req.body || {};

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ error: 'productId is required.' });
    }

    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty < 0) {
      return res.status(400).json({ error: 'quantity must be a non-negative integer.' });
    }

    try {
      await updateProductStock(productId.trim(), qty);
      return res.status(200).json({ success: true, productId, quantity: qty });
    } catch (err) {
      console.error('Inventory update error:', err);
      return res.status(500).json({ error: 'Failed to update inventory.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
