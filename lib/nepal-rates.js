/**
 * Daily gold/silver rates from FENEGOSIDA (Federation of Nepal Gold & Silver
 * Dealers' Association). This is the JSON feed behind fenegosida.org, not a
 * documented API, so every value is cross-checked and anything odd is refused.
 */
import { getMetalRates, upsertMetalRate } from './db-store.js';

const FENEGOSIDA_TODAY_URL = 'https://api.fenegosida.org/api/website/v1/Dashboard/today';
export const GRAMS_PER_TOLA = 11.664;

// Share of pure metal per purity; the site's rate keys are priced per gram at that purity.
export const PURITY = {
  // The owner's weights and prices already allow for 925 purity.
  silver_925: { metal: 'silver', factor: 1, label: 'Silver (pure)' },
  gold_24k: { metal: 'gold', factor: 1, label: '24K Gold' },
  gold_22k: { metal: 'gold', factor: 0.916, label: '22K Gold' },
  gold_18k: { metal: 'gold', factor: 0.75, label: '18K Gold' },
};

// Plausible NPR per gram of pure metal; outside this the feed is assumed broken.
const SANE_RANGE = { gold: [5000, 100000], silver: [50, 2000] };
export const MAX_DAILY_CHANGE = 0.15;

export class RateSyncError extends Error {}

const round2 = n => Math.round(n * 100) / 100;

/** Per-gram rate for a purity from a published fine (pure) rate per tola. */
export function perGramFromTola(fineRatePerTola, rateKey) {
  return round2((Number(fineRatePerTola) / GRAMS_PER_TOLA) * PURITY[rateKey].factor);
}

/**
 * Pick the fine gold/silver price per gram out of the feed. Each metal is listed
 * per 10 g and per tola (in Nepali); both must exist and agree within 1%.
 */
export function parseFenegosida(rows) {
  if (!Array.isArray(rows)) throw new RateSyncError('Unexpected response format');
  const find = (metalWord, unitWord) => rows.find(r => typeof r?.rateType === 'string'
    && r.rateType.includes(metalWord) && r.rateType.includes(unitWord));

  const result = {};
  for (const [metal, word] of [['gold', 'सुन'], ['silver', 'चाँदी']]) {
    const per10g = Number(find(word, '१० ग्राम')?.todayBaseRatePerGram);
    const perTola = Number(find(word, 'तोला')?.todayBaseRatePerGram);
    if (!(per10g > 0) || !(perTola > 0)) throw new RateSyncError(`Missing ${metal} rate`);

    const fromGrams = per10g / 10;
    const fromTola = perTola / GRAMS_PER_TOLA;
    if (Math.abs(fromGrams - fromTola) / fromGrams > 0.01) {
      throw new RateSyncError(`${metal} per-10g and per-tola rates disagree`);
    }
    const [min, max] = SANE_RANGE[metal];
    if (fromGrams < min || fromGrams > max) throw new RateSyncError(`${metal} rate ${fromGrams} out of range`);
    result[metal] = fromGrams;
  }

  const date = rows[0]?.todayDate ? new Date(rows[0].todayDate) : null;
  return { fineGoldPerGram: result.gold, fineSilverPerGram: result.silver, date: date && !isNaN(date) ? date : null };
}

export async function fetchFenegosidaRates() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(FENEGOSIDA_TODAY_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'AashishJewellers-RateSync/1.0' },
      signal: controller.signal,
    });
    if (!response.ok) throw new RateSyncError(`FENEGOSIDA responded ${response.status}`);
    return parseFenegosida(await response.json());
  } catch (error) {
    if (error instanceof RateSyncError) throw error;
    throw new RateSyncError(`Could not reach FENEGOSIDA: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Save today's rates as each purity's *current* rate. The baseline (what product
 * prices were set against) is never touched, so prices move only by the change.
 * Refuses jumps over 15% from the stored rate; returns what was saved/skipped.
 */
export async function syncMetalRatesFromFenegosida({ fetchRates = fetchFenegosidaRates, acceptBigChange = false } = {}) {
  const { fineGoldPerGram, fineSilverPerGram, date } = await fetchRates();
  const fine = { gold: fineGoldPerGram, silver: fineSilverPerGram };
  const stored = new Map((await getMetalRates()).map(row => [row.rate_key, row]));
  const dateLabel = date ? date.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

  const saved = [];
  const skipped = [];
  for (const [rateKey, { metal, factor, label }] of Object.entries(PURITY)) {
    const pricePerGram = round2(fine[metal] * factor);
    const existing = stored.get(rateKey);
    const previous = Number(existing?.price_per_gram) || 0;
    if (!acceptBigChange && previous > 0 && Math.abs(pricePerGram - previous) / previous > MAX_DAILY_CHANGE) {
      skipped.push({ rateKey, pricePerGram, previous, reason: 'changed more than 15% since last rate' });
      continue;
    }
    await upsertMetalRate({
      rateKey,
      label: existing?.label || label,
      pricePerGram,
      baselinePricePerGram: Number(existing?.baseline_price_per_gram) || 0,
      source: `FENEGOSIDA ${dateLabel}`,
      notes: existing?.notes || null,
    });
    saved.push({ rateKey, pricePerGram });
  }
  return { date: dateLabel, fineGoldPerGram, fineSilverPerGram, saved, skipped };
}
