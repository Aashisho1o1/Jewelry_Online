import { loadCatalogProductsWithPricing } from '../lib/catalog.js';
import { apiRateLimit } from '../lib/rate-limiter.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!apiRateLimit(req, res)) return;

  try {
    const products = await loadCatalogProductsWithPricing();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=60');

    return res.status(200).json(products);
  } catch (error) {
    console.error('Error loading products:', error.message);
    return res.status(500).json({ error: 'Failed to load products' });
  }
}
