import { getPublicStoreRates } from '../lib/store-rates.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
