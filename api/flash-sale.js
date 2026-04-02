/**
 * Flash Sale API
 * GET  /api/flash-sale  — public, returns active sale or null
 * POST /api/flash-sale  — admin, create/replace active sale
 * DELETE /api/flash-sale — admin, end active sale immediately
 */

import { requireAdminAuth } from '../lib/admin-auth.js';
import { getActiveFlashSale, upsertFlashSale, deactivateFlashSale } from '../lib/db-store.js';

export default async function handler(req, res) {
  // ── GET — public ────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    try {
      const sale = await getActiveFlashSale();
      return res.status(200).json({ sale: sale || null });
    } catch (err) {
      console.error('[flash-sale] GET error:', err.message);
      return res.status(500).json({ error: 'Failed to load flash sale' });
    }
  }

  // ── POST — admin: launch sale ────────────────────────────────────────────────
  if (req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;

    const { title, subtitle, discount_percent, ends_at } = req.body || {};

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title is required' });
    }
    const pct = parseFloat(discount_percent);
    if (isNaN(pct) || pct <= 0 || pct >= 100) {
      return res.status(400).json({ error: 'discount_percent must be between 1 and 99' });
    }
    if (!ends_at || isNaN(Date.parse(ends_at))) {
      return res.status(400).json({ error: 'ends_at must be a valid date/time' });
    }
    if (new Date(ends_at) <= new Date()) {
      return res.status(400).json({ error: 'ends_at must be in the future' });
    }

    try {
      const sale = await upsertFlashSale({ title: title.trim(), subtitle: subtitle?.trim() || null, discount_percent: pct, ends_at });
      return res.status(200).json({ success: true, sale });
    } catch (err) {
      console.error('[flash-sale] POST error:', err.message);
      return res.status(500).json({ error: 'Failed to launch flash sale' });
    }
  }

  // ── DELETE — admin: end sale ─────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    if (!requireAdminAuth(req, res)) return;

    try {
      await deactivateFlashSale();
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('[flash-sale] DELETE error:', err.message);
      return res.status(500).json({ error: 'Failed to end flash sale' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
