// Also handles /api/rates (public store rates) to stay within Vercel's 12-function limit.
import { requireAdminAuth } from '../lib/admin-auth.js';
import { getMetalRates, upsertMetalRate } from '../lib/db-store.js';
import { DEFAULT_METAL_RATES, normalizeMetalRateRecord } from '../lib/metal-pricing.js';
import { getPublicStoreRates } from '../lib/store-rates.js';

function buildRatePayload(row) {
  const normalized = normalizeMetalRateRecord(row);
  return {
    rateKey: normalized.rateKey,
    label: normalized.label,
    pricePerGram: normalized.pricePerGram,
    baselinePricePerGram: normalized.baselinePricePerGram,
    source: normalized.source,
    notes: normalized.notes,
    updatedAt: normalized.updatedAt,
  };
}

export default async function handler(req, res) {
  // Route /api/rates to public store rates endpoint
  if (req.url && req.url.split('?')[0].endsWith('/rates')) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const payload = await getPublicStoreRates();
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'public, max-age=60');
      return res.status(200).json(payload);
    } catch (error) {
      console.error('Public rates API error:', error);
      return res.status(500).json({ error: 'Failed to load current store rates.' });
    }
  }

  if (req.method === 'GET') {
    try {
      const storedRates = await getMetalRates();
      const rateMap = new Map(storedRates.map(row => [row.rate_key, row]));
      const rates = DEFAULT_METAL_RATES.map(rate =>
        buildRatePayload(rateMap.get(rate.rateKey) || { rate_key: rate.rateKey, label: rate.label })
      );

      return res.status(200).json({ rates });
    } catch (error) {
      console.error('Metal rates fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch metal rates.' });
    }
  }

  if (req.method === 'POST') {
    if (!requireAdminAuth(req, res)) return;

    const {
      rateKey,
      label,
      pricePerGram,
      baselinePricePerGram,
      source,
      notes,
    } = req.body || {};

    if (!rateKey || typeof rateKey !== 'string') {
      return res.status(400).json({ error: 'rateKey is required.' });
    }

    const parsedPricePerGram = Number(pricePerGram);
    const parsedBaselinePricePerGram = Number(baselinePricePerGram);

    if (!Number.isFinite(parsedPricePerGram) || parsedPricePerGram < 0) {
      return res.status(400).json({ error: 'pricePerGram must be a non-negative number.' });
    }

    if (!Number.isFinite(parsedBaselinePricePerGram) || parsedBaselinePricePerGram < 0) {
      return res.status(400).json({ error: 'baselinePricePerGram must be a non-negative number.' });
    }

    try {
      const updatedRate = await upsertMetalRate({
        rateKey: rateKey.trim(),
        label: typeof label === 'string' && label.trim() ? label.trim() : rateKey.trim(),
        pricePerGram: parsedPricePerGram,
        baselinePricePerGram: parsedBaselinePricePerGram,
        source: typeof source === 'string' && source.trim() ? source.trim() : null,
        notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      });

      return res.status(200).json({
        success: true,
        rate: buildRatePayload(updatedRate),
      });
    } catch (error) {
      console.error('Metal rate update error:', error);
      return res.status(500).json({ error: 'Failed to update metal rate.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
