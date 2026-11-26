import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { getMetalRates, getDbProducts, getActiveFlashSale } from './db-store.js';
import { applyMetalPricingToProducts, createMetalRateMap } from './metal-pricing.js';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'jewelry');

export function normalizeImagePath(imagePath) {
  if (!imagePath || typeof imagePath !== 'string') return '';

  let normalized = imagePath.trim().replace(/^["']|["']$/g, '');
  if (!normalized) return '';
  if (/^(https?:)?\/\//.test(normalized) || normalized.startsWith('data:')) return normalized;

  if (!normalized.startsWith('/')) normalized = `/${normalized}`;
  if (!normalized.startsWith('/images/')) normalized = `/images/jewelry/${normalized.replace(/^\/+/, '')}`;
  if (normalized.startsWith('/images/') && !normalized.startsWith('/images/jewelry/')) {
    normalized = normalized.replace('/images/', '/images/jewelry/');
  }

  return normalized.replace(/\/{2,}/g, '/');
}

export function parseFrontmatter(content) {
  const normalizedContent = content.replace(/\r\n?/g, '\n');
  const lines = normalizedContent.split('\n');

  if (lines[0] !== '---') {
    return { attributes: {}, body: normalizedContent };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i] === '---') {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { attributes: {}, body: normalizedContent };
  }

  // Real YAML: the CMS wraps long text over several lines. JSON_SCHEMA keeps dates as plain text.
  const parsed = yaml.load(lines.slice(1, endIndex).join('\n'), { schema: yaml.JSON_SCHEMA });
  const attributes = parsed && typeof parsed === 'object' ? parsed : {};
  const body = lines.slice(endIndex + 1).join('\n').trim();
  return { attributes, body };
}

function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

function toStringList(value) {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
}

// CMS reviews are not tied to an order, so they are never marked verified here.
function parseReviewEntry(entry) {
  const parts = String(entry)
    .split('|')
    .map(part => part.trim())
    .filter(Boolean);

  if (parts.length < 3) return null;

  const [author, ratingValue, third, fourth, fifth] = parts;
  const rating = Number(ratingValue);

  if (!author || !Number.isFinite(rating)) {
    return null;
  }

  if (parts.length >= 5) {
    return {
      author,
      rating: Math.max(1, Math.min(5, rating)),
      title: third,
      text: fourth,
      image: normalizeImagePath(fifth),
    };
  }

  return {
    author,
    rating: Math.max(1, Math.min(5, rating)),
    text: third,
    image: normalizeImagePath(fourth),
  };
}

function buildProduct(attributes) {
  if (!attributes.name || !attributes.id) return null;

  const parsedImages = Array.isArray(attributes.images)
    ? attributes.images.map(normalizeImagePath).filter(Boolean)
    : [];
  const occasions = toStringList(attributes.occasions);
  const recipients = toStringList(attributes.recipients);
  const styles = toStringList(attributes.styles);
  const colors = toStringList(attributes.colors);
  const tags = toStringList(attributes.tags);
  const highlights = toStringList(attributes.highlights);
  const care = toStringList(attributes.care);
  const bundleIds = toStringList(attributes.bundleIds);
  const reviews = toStringList(attributes.reviews)
    .map(parseReviewEntry)
    .filter(Boolean);
  const customerPhotos = [
    ...reviews.map(review => review.image).filter(Boolean),
    ...toStringList(attributes.customerPhotos).map(normalizeImagePath).filter(Boolean),
  ];
  const imageUrl = normalizeImagePath(attributes.image) || parsedImages[0] || '/images/jewelry/placeholder.svg';
  const images = [...new Set([imageUrl, ...parsedImages].filter(Boolean))];
  const averageRating = reviews.length
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : undefined;

  return {
    id: String(attributes.id),
    name: String(attributes.name),
    description: String(attributes.description || ''),
    price: Number(attributes.price) || 0,
    originalPrice: attributes.originalPrice ? Number(attributes.originalPrice) : undefined,
    image: imageUrl,
    images,
    category: String(attributes.category || 'rings'),
    material: String(attributes.material || '925_silver'),
    inStock: attributes.inStock !== false,
    featured: Boolean(attributes.featured),
    isNew: Boolean(attributes.isNew),
    adjustable: attributes.adjustable === true,
    // A bare number from the CMS means grams.
    weight: attributes.weight ? String(attributes.weight).trim().replace(/^\d+(\.\d+)?$/, '$&g') : undefined,
    priceMode: attributes.priceMode ? String(attributes.priceMode) : undefined,
    metalRateKey: attributes.metalRateKey ? String(attributes.metalRateKey) : undefined,
    pricingWeightGrams: toPositiveNumber(attributes.pricingWeightGrams),
    priceRoundingIncrement: toPositiveNumber(attributes.priceRoundingIncrement),
    wastagePercent: toPositiveNumber(attributes.wastagePercent),
    makingCharge: toPositiveNumber(attributes.makingCharge),
    makingChargeType: attributes.makingChargeType ? String(attributes.makingChargeType) : undefined,
    stoneCost: toPositiveNumber(attributes.stoneCost),
    priceBaseRate: toPositiveNumber(attributes.priceBaseRate),
    dimensions: attributes.dimensions ? String(attributes.dimensions) : undefined,
    stoneType: attributes.stoneType ? String(attributes.stoneType) : undefined,
    occasion: attributes.occasion
      ? String(attributes.occasion)
      : occasions[0],
    occasions: occasions.length > 0 ? occasions : undefined,
    recipients: recipients.length > 0 ? recipients : undefined,
    styles: styles.length > 0 ? styles : undefined,
    colors: colors.length > 0 ? colors : undefined,
    tags: tags.length > 0 ? tags : undefined,
    highlights: highlights.length > 0 ? highlights : undefined,
    care: care.length > 0 ? care : undefined,
    plating: attributes.plating ? String(attributes.plating) : undefined,
    collection: attributes.collection ? String(attributes.collection) : undefined,
    metalTone: attributes.metalTone ? String(attributes.metalTone) : undefined,
    designStory: attributes.designStory ? String(attributes.designStory) : undefined,
    styleNote: attributes.styleNote ? String(attributes.styleNote) : undefined,
    sizeGuide: attributes.sizeGuide ? String(attributes.sizeGuide) : undefined,
    fitNotes: attributes.fitNotes ? String(attributes.fitNotes) : undefined,
    warranty: attributes.warranty ? String(attributes.warranty) : undefined,
    deliveryEstimate: attributes.deliveryEstimate ? String(attributes.deliveryEstimate) : undefined,
    giftWrapAvailable: attributes.giftWrapAvailable !== false,
    giftCardAvailable: Boolean(attributes.giftCardAvailable),
    giftMessageSuggestion: attributes.giftMessageSuggestion ? String(attributes.giftMessageSuggestion) : undefined,
    bundleIds: bundleIds.length > 0 ? bundleIds : undefined,
    reviews: reviews.length > 0 ? reviews : undefined,
    customerPhotos: customerPhotos.length > 0 ? [...new Set(customerPhotos)] : undefined,
    reviewCount: Number(attributes.reviewCount) || reviews.length || undefined,
    rating: Number(attributes.rating) || averageRating,
  };
}

export function loadCatalogProducts() {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter(file => file.endsWith('.md'));
  const products = [];

  for (const file of files) {
    try {
      const filePath = path.join(CONTENT_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const { attributes } = parseFrontmatter(content);
      const product = buildProduct(attributes);

      if (product) {
        products.push(product);
      }
    } catch (error) {
      console.error(`Failed to load product file ${file}:`, error.message);
    }
  }

  return products;
}

export function loadCatalogProductMap() {
  return new Map(loadCatalogProducts().map(product => [String(product.id), product]));
}

export function getCatalogProductById(productId) {
  return loadCatalogProductMap().get(String(productId)) || null;
}

async function loadMetalRateMap(health) {
  if (!process.env.DATABASE_URL) {
    return createMetalRateMap();
  }

  try {
    const rates = await getMetalRates();
    return createMetalRateMap(rates);
  } catch (error) {
    health.ok = false;
    console.error('Failed to load metal rates, falling back to manual pricing:', error.message);
    return createMetalRateMap();
  }
}

function buildProductFromDbRow(row) {
  const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];
  const imageUrl = images[0] || '/images/jewelry/placeholder.svg';
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description || ''),
    price: Number(row.price) || 0,
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    image: imageUrl,
    images: images.length > 0 ? images : [imageUrl],
    category: String(row.category || 'rings'),
    material: String(row.material || '925_silver'),
    inStock: row.in_stock !== false,
    isNew: Boolean(row.is_new),
    featured: Boolean(row.featured),
    priceMode: row.price_mode || undefined,
    wastagePercent: toPositiveNumber(row.wastage_percent),
    makingCharge: toPositiveNumber(row.making_charge),
    makingChargeType: row.making_charge_type || undefined,
    stoneCost: toPositiveNumber(row.stone_cost),
    priceBaseRate: toPositiveNumber(row.price_base_rate),
    pricingWeightGrams: toPositiveNumber(row.pricing_weight_grams),
    weight: row.weight ? String(row.weight) : undefined,
    dimensions: row.dimensions ? String(row.dimensions) : undefined,
    care: row.care_instructions ? [String(row.care_instructions)] : undefined,
    tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : undefined,
    priceSource: row.price_source || 'fixed',
    giftWrapAvailable: true,
  };
}

async function loadDbProductsAsMap(health) {
  if (!process.env.DATABASE_URL) return new Map();
  try {
    const rows = await getDbProducts();
    // Draft and hidden products are kept as null so they also hide a CMS file with the same code.
    return new Map(rows.map(row => [String(row.id), (row.status || 'live') === 'live' ? buildProductFromDbRow(row) : null]));
  } catch (err) {
    health.ok = false;
    console.error('Failed to load DB products, using markdown only:', err.message);
    return new Map();
  }
}

async function loadActiveFlashSalePercent(health) {
  if (!process.env.DATABASE_URL) return 0;
  try {
    const sale = await getActiveFlashSale();
    if (sale?.ends_at) health.saleEndsAt = new Date(sale.ends_at).getTime();
    const pct = Number(sale?.discount_percent);
    return pct > 0 && pct < 100 ? pct : 0;
  } catch (err) {
    health.ok = false;
    console.error('Failed to load flash sale, using regular prices:', err.message);
    return 0;
  }
}

// Applied here so the storefront, cart and order validation all see the same sale price.
function applyFlashSale(product, pct) {
  if (!pct) return product;
  return {
    ...product,
    price: Math.round(product.price * (1 - pct / 100)),
    originalPrice: product.price,
    flashSalePercent: Math.round(pct),
  };
}

/** health reports if any part fell back (so it must not be cached) and when a sale ends. */
export async function loadCatalogProductsWithPricing(health = {}) {
  health.ok = true;
  const [mdProducts, dbMap, rateMap, flashPct] = await Promise.all([
    Promise.resolve(loadCatalogProducts()),
    loadDbProductsAsMap(health),
    loadMetalRateMap(health),
    loadActiveFlashSalePercent(health),
  ]);

  // DB products override markdown products with the same ID
  const merged = new Map(mdProducts.map(p => [p.id, p]));
  for (const [id, product] of dbMap) {
    if (product) merged.set(id, product);
    else merged.delete(id);
  }

  return applyMetalPricingToProducts(Array.from(merged.values()), rateMap)
    // Never sell at NPR 0, e.g. a calculated price with no rate and no saved price.
    .map(product => (product.price > 0 ? product : { ...product, inStock: false }))
    .map(product => applyFlashSale(product, flashPct));
}

export async function loadCatalogProductMapWithPricing() {
  return new Map((await loadCatalogProductsWithPricing()).map(product => [String(product.id), product]));
}

export async function getCatalogProductByIdWithPricing(productId) {
  return (await loadCatalogProductMapWithPricing()).get(String(productId)) || null;
}
