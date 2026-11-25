// Admin product form: validation, automatic codes and pricing. Used by api/products.js and the dev server.
import { loadCatalogProducts } from './catalog.js';
import { getDbProduct, getDbProducts, getInventory, getMetalRates, insertDbProduct, saveDbProduct, updateProductStock } from './db-store.js';
import {
  FORMULA_PRICE_MODE, LIVE_PRICE_MODE, MANUAL_PRICE_MODE, calculateFormulaPrice, createMetalRateMap, followRatePrice,
  inferMetalRateKey, parseWeightGrams,
} from './metal-pricing.js';

export class ProductInputError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const CODE_PREFIX = {
  rings: 'RG', necklaces: 'NS', earrings: 'ER', bracelets: 'BR', sets: 'ST', tilahari: 'TL', mangalsutra: 'MG',
  sikri: 'SK', baala: 'BL', bulaki: 'BK', pote: 'PT', pauju: 'PJ', 'maang-tika': 'MT', haar: 'HR', dhungri: 'DG',
};
const MATERIALS = new Set([
  '925_silver', 'gold_18k', 'gold_22k', 'gold_24k', 'gold_plated', 'rose_gold_plated', 'stone_studded', 'mixed_metals', 'beaded',
]);
const STATUSES = new Set(['draft', 'live', 'hidden']);
const CHARGE_TYPES = new Set(['fixed', 'per_gram', 'percent']);
const IMAGE = /^\/images\/jewelry\/[\w.()/ -]+\.(jpe?g|png|webp)$/i;
const MIN_PRICE = 100;
const MAX_PRICE = 5000000;
const BIG_PRICE_CHANGE = 0.3;

const bad = message => new ProductInputError(400, message);

function text(value, label, max) {
  const clean = String(value ?? '').trim();
  if (clean.length > max) throw bad(`${label} is too long.`);
  return clean;
}

function number(value, label, { min = 0, max = MAX_PRICE } = {}) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  if (typeof value === 'boolean' || !Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw bad(`${label} must be between ${min} and ${max}.`);
  }
  return parsed;
}

async function loadRates() {
  return createMetalRateMap(await getMetalRates());
}

function formulaFor(row, rates) {
  const rate = rates.get(inferMetalRateKey(row.material));
  return calculateFormulaPrice({
    ratePerGram: rate?.pricePerGram,
    weightGrams: Number(row.pricing_weight_grams) || parseWeightGrams(row.weight),
    wastagePercent: row.wastage_percent,
    makingCharge: row.making_charge,
    makingChargeType: row.making_charge_type,
    stoneCost: row.stone_cost,
  });
}

function followFor(row, rates) {
  return followRatePrice({
    price: row.price,
    baseRate: row.price_base_rate,
    ratePerGram: rates.get(inferMetalRateKey(row.material))?.pricePerGram,
    weightGrams: Number(row.pricing_weight_grams) || parseWeightGrams(row.weight),
  });
}

// What a customer pays today for a saved row, before any flash sale.
function currentPrice(row, rates) {
  if (row.price_mode === FORMULA_PRICE_MODE) return formulaFor(row, rates)?.price ?? Number(row.price);
  if (row.price_mode === LIVE_PRICE_MODE) return followFor(row, rates) ?? Number(row.price);
  return Number(row.price);
}

/** Checks the whole product (saved values + changes) so a partial update can't leave it invalid. */
function cleanProduct(input, rates, existing = null) {
  const status = String(input.status ?? 'draft');
  if (!STATUSES.has(status)) throw bad('Unknown status.');
  const category = String(input.category ?? '');
  if (!Object.hasOwn(CODE_PREFIX, category)) throw bad('Choose the type of jewellery.');
  const material = String(input.material ?? '');
  if (!MATERIALS.has(material)) throw bad('Choose the metal.');
  const name = text(input.name, 'Name', 120);
  if (!name) throw bad('Enter the name.');

  const images = Array.isArray(input.images) ? input.images.map(String) : [];
  if (images.length > 10) throw bad('Use up to 10 photos.');
  if (images.some(src => !IMAGE.test(src) || src.includes('..'))) throw bad('A photo address is not valid.');

  const grams = number(input.weight === null ? null : parseWeightGrams(input.weight) ?? input.weight, 'Weight', { max: 5000 });
  const priceMode = [FORMULA_PRICE_MODE, LIVE_PRICE_MODE].includes(input.price_mode) ? input.price_mode : MANUAL_PRICE_MODE;
  const chargeType = String(input.making_charge_type || 'fixed');
  if (!CHARGE_TYPES.has(chargeType)) throw bad('Unknown making charge type.');

  const row = {
    name,
    category,
    material,
    status,
    description: text(input.description, 'Description', 3000) || null,
    care_instructions: text(input.care_instructions, 'Care', 1000) || null,
    dimensions: text(input.dimensions, 'Size', 120) || null,
    weight: grams ? `${grams}g` : null,
    pricing_weight_grams: number(input.pricing_weight_grams, 'Weight without stones', { max: 5000 }),
    price_mode: priceMode,
    wastage_percent: number(input.wastage_percent, 'Wastage %', { max: 50 }),
    making_charge: number(input.making_charge, 'Making charge', { max: chargeType === 'percent' ? 200 : MAX_PRICE }),
    making_charge_type: chargeType,
    stone_cost: number(input.stone_cost, 'Stone cost'),
    price_base_rate: null,
    original_price: number(input.original_price, 'Old price'),
    in_stock: input.in_stock !== false,
    is_new: input.is_new === true,
    featured: input.featured === true,
    images,
    tags: (Array.isArray(input.tags) ? input.tags : []).map(tag => text(tag, 'Tag', 40)).filter(Boolean).slice(0, 20),
  };

  if (priceMode === FORMULA_PRICE_MODE) {
    if (row.pricing_weight_grams && grams && row.pricing_weight_grams > grams) throw bad('Weight without stones is more than the full weight.');
    const result = formulaFor(row, rates);
    if (!result && status === 'live') {
      throw bad(!inferMetalRateKey(material) ? 'This metal has no daily rate. Use a fixed price.'
        : !grams ? 'Enter the weight.' : 'There is no rate for this metal today. Add it under Metal rates, or use a fixed price.');
    }
    // Kept as the fallback if a rate is ever missing.
    row.price = result?.price ?? number(input.price, 'Price') ?? 0;
  } else {
    row.price = number(input.price, 'Price') ?? 0;
  }
  if (priceMode === LIVE_PRICE_MODE) {
    const rateNow = rates.get(inferMetalRateKey(material))?.pricePerGram;
    // The typed price belongs to today's rate; keep the old starting rate only if nothing about the price changed.
    const same = existing && existing.price_mode === LIVE_PRICE_MODE && existing.material === material
      && Number(existing.price) === row.price && existing.weight === row.weight
      && Number(existing.pricing_weight_grams || 0) === Number(row.pricing_weight_grams || 0);
    row.price_base_rate = (same && Number(existing.price_base_rate)) || rateNow || null;
    if (status === 'live' && !(followFor(row, rates) > 0)) {
      throw bad(!inferMetalRateKey(material) ? 'This metal has no daily rate. Use a fixed price.'
        : !grams ? 'Enter the weight.' : 'There is no rate for this metal today. Add it under Metal rates, or use a fixed price.');
    }
  }
  if (status === 'live') {
    if (row.price < MIN_PRICE || row.price > MAX_PRICE) throw bad(`Price must be between NPR ${MIN_PRICE} and ${MAX_PRICE}.`);
    if (!images.length) throw bad('Add at least one photo before showing it in the shop. You can save it as a draft.');
  }
  return row;
}

function stockChange(body) {
  if (body.stock === undefined) return null;
  const stock = Number(body.stock);
  if (!Number.isInteger(stock) || stock < 0 || stock > 999) throw bad('Stock must be 0 to 999.');
  return stock;
}

function nextCode(category, ids) {
  const prefix = CODE_PREFIX[category];
  const used = ids.map(id => String(id).toUpperCase().match(new RegExp(`^${prefix}(\\d+)$`))).filter(Boolean).map(m => Number(m[1]));
  return prefix + String(Math.max(0, ...used) + 1).padStart(3, '0');
}

function requireDatabase() {
  if (!process.env.DATABASE_URL) throw new ProductInputError(503, 'Products need the online database.');
}

export async function listAdminProducts() {
  requireDatabase();
  const [rows, inventory, rates] = await Promise.all([getDbProducts(), getInventory(), loadRates()]);
  const stock = new Map(inventory.map(item => [item.product_id, item.quantity]));
  const ids = new Set(rows.map(row => row.id));
  return {
    products: rows.map(row => ({ ...row, stock: stock.get(row.id) ?? null, current_price: currentPrice(row, rates) })),
    // Still edited in the laptop CMS; listed so the shop can be seen in one place.
    cmsProducts: loadCatalogProducts().filter(p => !ids.has(p.id))
      .map(p => ({ id: p.id, name: p.name, category: p.category, price: p.price, image: p.image })),
  };
}

export async function createAdminProduct(body = {}) {
  requireDatabase();
  const row = cleanProduct(body, await loadRates());
  const stock = stockChange(body);
  if (stock !== null) row.in_stock = stock > 0;
  // Two saves at once can pick the same code; the database refuses the second, which then takes the next one.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const ids = [...loadCatalogProducts(), ...(await getDbProducts())].map(p => p.id);
    const id = nextCode(row.category, ids);
    try {
      const saved = await insertDbProduct(id, row);
      if (stock !== null) await updateProductStock(id, stock);
      return saved;
    } catch (error) {
      if (error.code !== '23505') throw error;
    }
  }
  throw new ProductInputError(409, 'Please try saving again.');
}

export async function updateAdminProduct(body = {}) {
  requireDatabase();
  const existing = typeof body.id === 'string' ? await getDbProduct(body.id) : null;
  if (!existing) throw new ProductInputError(404, 'Product not found.');
  const rates = await loadRates();
  const row = cleanProduct({ ...existing, ...body }, rates, existing);
  const stock = stockChange(body);
  if (stock !== null) row.in_stock = stock > 0;

  const before = currentPrice(existing, rates);
  if (row.status === 'live' && before > 0 && body.confirmPrice !== true) {
    const after = currentPrice(row, rates);
    const change = Math.abs(after - before) / before;
    if (change > BIG_PRICE_CHANGE) {
      throw new ProductInputError(409, `Price changes by ${Math.round(change * 100)}%: NPR ${before} to NPR ${after}. Is this right?`, { needsConfirm: true });
    }
  }
  const saved = await saveDbProduct(existing.id, row);
  if (stock !== null) await updateProductStock(existing.id, stock);
  return saved;
}
