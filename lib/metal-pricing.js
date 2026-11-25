export const LIVE_PRICE_MODE = 'live_metal';
// Price built from today's rate, weight, wastage, making charge and stones.
export const FORMULA_PRICE_MODE = 'formula';
export const MANUAL_PRICE_MODE = 'manual';
export const DEFAULT_PRICE_ROUNDING_INCREMENT = 10;

export const DEFAULT_METAL_RATES = [
  { rateKey: 'silver_925', label: '925 Silver' },
  { rateKey: 'gold_18k', label: '18K Gold' },
  { rateKey: 'gold_22k', label: '22K Gold' },
  { rateKey: 'gold_24k', label: '24K Gold' },
];

const MATERIAL_RATE_KEY_MAP = {
  '925_silver': 'silver_925',
  gold_18k: 'gold_18k',
  gold_22k: 'gold_22k',
  gold_24k: 'gold_24k',
};

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundToIncrement(value, increment) {
  if (!Number.isFinite(value)) return 0;

  const normalizedIncrement = toFiniteNumber(increment);
  if (!normalizedIncrement || normalizedIncrement <= 0) {
    return Math.round(value);
  }

  return Math.round(value / normalizedIncrement) * normalizedIncrement;
}

function clampPrice(value, increment) {
  return Math.max(0, roundToIncrement(value, increment));
}

export function inferMetalRateKey(material) {
  return MATERIAL_RATE_KEY_MAP[String(material || '').trim()] || null;
}

export function parseWeightGrams(value) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return value;
  }

  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;

  const match = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function normalizeMetalRateRecord(row = {}) {
  return {
    rateKey: String(row.rate_key || row.rateKey || '').trim(),
    label: String(row.label || '').trim(),
    pricePerGram: toFiniteNumber(row.price_per_gram ?? row.pricePerGram) ?? 0,
    baselinePricePerGram: toFiniteNumber(row.baseline_price_per_gram ?? row.baselinePricePerGram) ?? 0,
    source: row.source ? String(row.source) : null,
    notes: row.notes ? String(row.notes) : null,
    updatedAt: row.updated_at || row.updatedAt || null,
  };
}

export function createMetalRateMap(rows = []) {
  const rateMap = new Map();

  for (const defaultRate of DEFAULT_METAL_RATES) {
    rateMap.set(defaultRate.rateKey, {
      ...defaultRate,
      pricePerGram: 0,
      baselinePricePerGram: 0,
      source: null,
      notes: null,
      updatedAt: null,
    });
  }

  for (const row of rows) {
    const normalized = normalizeMetalRateRecord(row);
    if (!normalized.rateKey) continue;

    const existing = rateMap.get(normalized.rateKey);
    rateMap.set(normalized.rateKey, {
      label: normalized.label || existing?.label || normalized.rateKey,
      pricePerGram: normalized.pricePerGram,
      baselinePricePerGram: normalized.baselinePricePerGram,
      source: normalized.source,
      notes: normalized.notes,
      updatedAt: normalized.updatedAt,
      rateKey: normalized.rateKey,
    });
  }

  return rateMap;
}

function positive(value) {
  const parsed = toFiniteNumber(value);
  return parsed && parsed > 0 ? parsed : 0;
}

// Also used by the CMS form (cms/sell-price.js), so the owner sees the price customers pay.
export function calculateFormulaPrice({
  ratePerGram, weightGrams, wastagePercent, makingCharge, makingChargeType, stoneCost, roundingIncrement,
}) {
  const rate = positive(ratePerGram);
  const weight = positive(weightGrams);
  if (!rate || !weight) return null;

  const metal = rate * weight;
  const wastage = metal * positive(wastagePercent) / 100;
  const charge = positive(makingCharge);
  const making = makingChargeType === 'percent' ? metal * charge / 100
    : makingChargeType === 'per_gram' ? charge * weight
      : charge;
  const stones = positive(stoneCost);

  return {
    metal, wastage, making, stones,
    price: clampPrice(metal + wastage + making + stones, positive(roundingIncrement) || DEFAULT_PRICE_ROUNDING_INCREMENT),
  };
}

/**
 * Typed price that moves with the rate: price + (rate now - rate when it was typed) x weight.
 * Only the movement is rounded, so the price is exactly what was typed until the rate changes.
 */
export function followRatePrice({ price, baseRate, ratePerGram, weightGrams, roundingIncrement }) {
  const base = positive(baseRate);
  const rate = positive(ratePerGram);
  const weight = positive(weightGrams);
  if (!positive(price) || !base || !rate || !weight) return null;
  const change = roundToIncrement((rate - base) * weight, positive(roundingIncrement) || DEFAULT_PRICE_ROUNDING_INCREMENT);
  return Math.max(0, Number(price) + change);
}

// Shop margins stay on the server; customers only get the final price.
export function applyMetalPricing(rawProduct, rateMap) {
  const { wastagePercent, makingCharge, makingChargeType, stoneCost, priceBaseRate, ...product } = rawProduct;
  return priceProduct(product, { wastagePercent, makingCharge, makingChargeType, stoneCost, priceBaseRate }, rateMap);
}

function priceProduct(product, charges, rateMap) {
  const basePrice = toFiniteNumber(product?.price) ?? 0;
  const baseOriginalPrice = toFiniteNumber(product?.originalPrice);
  const priceMode = String(product?.priceMode || MANUAL_PRICE_MODE);
  const metalRateKey = product?.metalRateKey || inferMetalRateKey(product?.material);
  const weightGrams = toFiniteNumber(product?.pricingWeightGrams) || parseWeightGrams(product?.weight);
  const roundingIncrement =
    toFiniteNumber(product?.priceRoundingIncrement) ?? DEFAULT_PRICE_ROUNDING_INCREMENT;

  const manualResult = {
    ...product,
    price: basePrice,
    ...(baseOriginalPrice !== null ? { originalPrice: baseOriginalPrice } : {}),
    priceMode,
    metalRateKey: metalRateKey || undefined,
    pricingWeightGrams: weightGrams || undefined,
    priceRoundingIncrement: roundingIncrement,
    priceSource: 'manual',
    currentMetalRate: undefined,
    baselineMetalRate: undefined,
    priceAdjustment: undefined,
    priceUpdatedAt: undefined,
    metalRateLabel: undefined,
  };

  if (priceMode === FORMULA_PRICE_MODE) {
    const rate = rateMap?.get(metalRateKey);
    const result = calculateFormulaPrice({
      ...charges, ratePerGram: rate?.pricePerGram, weightGrams, roundingIncrement,
    });
    // No rate today: fall back to the price the CMS last saved.
    if (!result) return manualResult;
    return {
      ...manualResult,
      price: result.price,
      // Hide a "was" price that a rate rise has overtaken.
      originalPrice: baseOriginalPrice > result.price ? baseOriginalPrice : undefined,
      priceSource: 'market_rate',
      currentMetalRate: toFiniteNumber(rate.pricePerGram),
      priceUpdatedAt: rate.updatedAt || undefined,
      metalRateLabel: rate.label || metalRateKey,
    };
  }

  if (priceMode !== LIVE_PRICE_MODE || !metalRateKey || !weightGrams || !rateMap?.has(metalRateKey)) {
    return manualResult;
  }

  const rate = rateMap.get(metalRateKey);
  const currentMetalRate = toFiniteNumber(rate?.pricePerGram);
  // The product's own starting rate; older products may still rely on the shared baseline.
  const baselineMetalRate = positive(charges.priceBaseRate) || toFiniteNumber(rate?.baselinePricePerGram);
  const follow = value => followRatePrice({
    price: value, baseRate: baselineMetalRate, ratePerGram: currentMetalRate, weightGrams, roundingIncrement,
  });
  const computedPrice = follow(basePrice);
  if (computedPrice === null) return manualResult;

  const priceAdjustment = computedPrice - basePrice;
  const computedOriginalPrice = baseOriginalPrice !== null ? follow(baseOriginalPrice) ?? baseOriginalPrice : undefined;

  return {
    ...product,
    price: computedPrice,
    ...(computedOriginalPrice !== undefined ? { originalPrice: computedOriginalPrice } : {}),
    priceMode,
    metalRateKey,
    pricingWeightGrams: weightGrams,
    priceRoundingIncrement: roundingIncrement,
    priceSource: 'market_rate',
    currentMetalRate,
    baselineMetalRate,
    priceAdjustment: roundToIncrement(priceAdjustment, 1),
    priceUpdatedAt: rate.updatedAt || undefined,
    metalRateLabel: rate.label || metalRateKey,
  };
}

export function applyMetalPricingToProducts(products, rateMap) {
  return products.map(product => applyMetalPricing(product, rateMap));
}
