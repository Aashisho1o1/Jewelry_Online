import { getMetalRates } from './db-store.js';
import { DEFAULT_METAL_RATES, createMetalRateMap } from './metal-pricing.js';

function buildPublicRate(rateKey, rateMap) {
  const rate = rateMap.get(rateKey);
  if (!rate) {
    return null;
  }

  const pricePerGram = Number(rate.pricePerGram);
  const isActive = Number.isFinite(pricePerGram) && pricePerGram > 0;

  return {
    rateKey,
    label: rate.label,
    pricePerGram: isActive ? pricePerGram : 0,
    unit: 'gram',
    currency: 'NPR',
    updatedAt: rate.updatedAt || null,
    sourceLabel: rate.source || 'Aashish in-store rate',
    isActive,
  };
}

export async function getPublicStoreRates() {
  const storedRates = await getMetalRates();
  const rateMap = createMetalRateMap(storedRates);
  const rates = DEFAULT_METAL_RATES
    .map(rate => buildPublicRate(rate.rateKey, rateMap))
    .filter(Boolean);
  const activeRates = rates.filter(rate => rate.isActive);

  const updatedAtCandidates = activeRates
    .map(rate => rate.updatedAt)
    .filter(Boolean)
    .sort();

  return {
    storeName: 'Aashish Jewellers',
    baseCurrency: 'NPR',
    status: activeRates.length > 0 ? 'live' : 'pending',
    updatedAt: updatedAtCandidates.length > 0 ? updatedAtCandidates[updatedAtCandidates.length - 1] : null,
    rates,
  };
}
