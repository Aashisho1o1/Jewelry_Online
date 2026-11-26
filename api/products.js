/**
 * Consolidated products + reviews handler — routes by sub-path.
 *
 * GET  /api/products               — public catalog
 * GET  /api/products/admin-list    — admin DB list
 * POST /api/products/create        — admin create
 * PUT  /api/products/update        — admin update
 * GET  /api/reviews                — public reviews by productId
 * POST /api/reviews                — submit review
 */

import { loadCatalogProductsWithPricing } from '../lib/catalog.js';
import { cacheUntilChanged, clearCache } from '../lib/cdn-cache.js';
import { apiRateLimit, rateLimit } from '../lib/rate-limiter.js';
import { requireAdminAuth } from '../lib/admin-auth.js';
import { ProductInputError, createAdminProduct, listAdminProducts, listUsedCodes, updateAdminProduct } from '../lib/product-admin.js';
import { photoUsage, savePhoto, sendPhoto } from '../lib/product-photos.js';
import { query, queryMany } from '../lib/db.js';

const reviewRateLimit = rateLimit({ windowMs: 60_000, max: 3, message: 'Too many reviews submitted. Please wait a moment before trying again.' });

function getAction(req) {
  const pathname = req.url.split('?')[0];
  // /api/reviews or /api/reviews?...
  if (pathname === '/api/reviews' || pathname.startsWith('/api/reviews?')) return 'reviews';
  const match = pathname.match(/\/products\/(.+)$/);
  return match ? match[1] : '';
}

export default async function handler(req, res) {
  const action = getAction(req);

  // GET/POST /api/reviews
  if (action === 'reviews') {
    const { productId } = req.query;
    if (req.method === 'GET') {
      if (typeof productId !== 'string' || !/^[\w-]{1,40}$/.test(productId)) return res.status(400).json({ error: 'productId is required' });
      const reviews = await queryMany('SELECT id, author_name, rating, title, body, created_at FROM reviews WHERE product_id = $1 ORDER BY created_at DESC', [productId]);
      const count = reviews.length;
      const averageRating = count > 0 ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : 0;
      cacheUntilChanged(req, res, `reviews-${productId}`, { allowQuery: true });
      return res.status(200).json({ reviews, averageRating, count });
    }
    if (req.method === 'POST') {
      const allowed = await reviewRateLimit(req, res);
      if (!allowed) return;
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { productId: bodyProductId, authorName, rating, title, body: reviewBody } = body || {};
      const pid = bodyProductId || productId;
      if (typeof pid !== 'string' || !/^[\w-]{1,40}$/.test(pid)) return res.status(400).json({ error: 'productId is required' });
      if (!authorName || typeof authorName !== 'string' || authorName.trim().length < 2 || authorName.trim().length > 50) {
        return res.status(400).json({ error: 'Author name must be 2-50 characters.' });
      }
      const ratingNum = Number(rating);
      if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ error: 'Rating must be a whole number between 1 and 5.' });
      if (!reviewBody || typeof reviewBody !== 'string' || reviewBody.trim().length < 10 || reviewBody.trim().length > 500) {
        return res.status(400).json({ error: 'Review must be 10-500 characters.' });
      }
      if (title != null && (typeof title !== 'string' || title.trim().length > 100)) {
        return res.status(400).json({ error: 'Title must be text up to 100 characters.' });
      }
      const review = await query('INSERT INTO reviews (product_id, author_name, rating, title, body) VALUES ($1, $2, $3, $4, $5) RETURNING id, author_name, rating, title, body, created_at', [pid, authorName.trim(), ratingNum, title?.trim() || null, reviewBody.trim()]);
      await clearCache(`reviews-${pid}`);
      return res.status(201).json({ review });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // GET /api/products (public catalog, no sub-path)
  if (action === '') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!(await apiRateLimit(req, res))) return;
    try {
      const health = {};
      const products = await loadCatalogProductsWithPricing(health);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      // Never keep fallback prices, or a sale past its end.
      if (health.ok) cacheUntilChanged(req, res, 'products', { maxSeconds: health.saleEndsAt ? (health.saleEndsAt - Date.now()) / 1000 : undefined });
      else res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(products);
    } catch (error) {
      console.error('Error loading products:', error.message);
      return res.status(500).json({ error: 'Failed to load products' });
    }
  }

  // GET /api/products/photo/<id>.jpg (public, kept by the CDN for a year)
  if (action.startsWith('photo/')) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    try {
      return await sendPhoto(req.url.split('?')[0], res);
    } catch (err) {
      console.error('photo error:', err);
      return res.status(500).end('Error');
    }
  }

  // GET /api/products/codes (public): codes only, so the CMS can avoid ones the dashboard used
  if (action === 'codes') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    res.setHeader('Cache-Control', 'no-store');
    try {
      return res.status(200).json(await listUsedCodes());
    } catch (err) {
      console.error('codes error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  const admin = {
    'admin-list': ['GET', async () => ({ ...(await listAdminProducts()), photoUsage: await photoUsage() })],
    photo: ['POST', async () => savePhoto(req.body)],
    create: ['POST', async () => ({ product: await createAdminProduct(req.body) })],
    update: ['PUT', async () => ({ product: await updateAdminProduct(req.body) })],
  };
  if (Object.hasOwn(admin, action)) {
    const [method, run] = admin[action];
    if (req.method !== method) return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    res.setHeader('Cache-Control', 'no-store');
    try {
      const result = await run();
      if (method !== 'GET' && action !== 'photo') await clearCache('products');
      return res.status(action === 'create' ? 201 : 200).json(result);
    } catch (err) {
      if (err instanceof ProductInputError) return res.status(err.status).json({ error: err.message, ...err.extra });
      console.error(`${action} product error:`, err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(404).json({ error: 'Unknown products endpoint' });
}
