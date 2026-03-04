import { rateLimit } from '../lib/rate-limiter.js';
import { query, queryMany } from '../lib/db.js';

const reviewRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: 'Too many reviews submitted. Please wait a moment before trying again.',
});

export default async function handler(req, res) {
  const { productId } = req.query;

  // GET /api/reviews?productId=xxx
  if (req.method === 'GET') {
    if (!productId) {
      return res.status(400).json({ error: 'productId is required' });
    }

    const reviews = await queryMany(
      'SELECT id, author_name, rating, title, body, created_at FROM reviews WHERE product_id = $1 ORDER BY created_at DESC',
      [productId]
    );

    const count = reviews.length;
    const averageRating = count > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : 0;

    return res.status(200).json({ reviews, averageRating, count });
  }

  // POST /api/reviews
  if (req.method === 'POST') {
    const allowed = await reviewRateLimit(req, res);
    if (!allowed) return;

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { productId: bodyProductId, authorName, rating, title, body: reviewBody } = body || {};

    const pid = bodyProductId || productId;
    if (!pid) return res.status(400).json({ error: 'productId is required' });

    if (!authorName || typeof authorName !== 'string' || authorName.trim().length < 2 || authorName.trim().length > 50) {
      return res.status(400).json({ error: 'Author name must be 2-50 characters.' });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be a whole number between 1 and 5.' });
    }

    if (!reviewBody || typeof reviewBody !== 'string' || reviewBody.trim().length < 10 || reviewBody.trim().length > 500) {
      return res.status(400).json({ error: 'Review must be 10-500 characters.' });
    }

    const review = await query(
      'INSERT INTO reviews (product_id, author_name, rating, title, body) VALUES ($1, $2, $3, $4, $5) RETURNING id, author_name, rating, title, body, created_at',
      [pid, authorName.trim(), ratingNum, title?.trim() || null, reviewBody.trim()]
    );

    return res.status(201).json({ review });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
