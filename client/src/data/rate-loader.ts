import { StoreRatesResponse } from '../types/rates';

let cachedRates: StoreRatesResponse | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 60_000;

async function loadRates(): Promise<StoreRatesResponse> {
  const response = await fetch('/api/rates');

  if (!response.ok) {
    throw new Error(`Rates API request failed with status: ${response.status}`);
  }

  const payload = await response.json();

  return {
    storeName: String(payload.storeName || 'Aashish Jewellers'),
    baseCurrency: 'NPR',
    status: payload.status === 'live' ? 'live' : 'pending',
    updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : null,
    rates: Array.isArray(payload.rates)
      ? payload.rates.filter((rate: any) =>
          rate &&
          typeof rate.rateKey === 'string' &&
          typeof rate.label === 'string' &&
          typeof rate.pricePerGram === 'number'
        )
        .map((rate: any) => ({
          rateKey: rate.rateKey,
          label: rate.label,
          pricePerGram: rate.pricePerGram,
          unit: rate.unit === 'gram' ? 'gram' : 'gram',
          currency: rate.currency === 'NPR' ? 'NPR' : 'NPR',
          updatedAt: typeof rate.updatedAt === 'string' ? rate.updatedAt : null,
          sourceLabel: typeof rate.sourceLabel === 'string' ? rate.sourceLabel : 'Aashish in-store rate',
          isActive: rate.isActive === true,
        }))
      : [],
  };
}

export async function getStoreRates(forceRefresh = false): Promise<StoreRatesResponse> {
  const cacheExpired = Date.now() - cacheTimestamp > CACHE_DURATION;

  if (cachedRates === null || forceRefresh || cacheExpired) {
    cachedRates = await loadRates();
    cacheTimestamp = Date.now();
  }

  return cachedRates;
}

export function clearStoreRatesCache() {
  cachedRates = null;
  cacheTimestamp = 0;
}
