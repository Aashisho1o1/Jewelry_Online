import { JewelryProduct } from '@/types/jewelry';

export type ShopFacetKey = 'occasion' | 'recipient' | 'style' | 'metal' | 'color' | 'price';

export interface ShopFacetOption {
  label: string;
  slug: string;
  count: number;
}

export const SHOP_FACETS: Array<{
  key: ShopFacetKey;
  label: string;
  description: string;
}> = [
  { key: 'occasion', label: 'Occasion', description: 'Birthday, anniversary, festive and daily wear picks.' },
  { key: 'recipient', label: 'Recipient', description: 'Find gifts for her, mother, sister and more.' },
  { key: 'style', label: 'Style', description: 'Minimal, statement, classic and stacking-friendly pieces.' },
  { key: 'metal', label: 'Metal', description: 'Browse by silver, plating and finish.' },
  { key: 'color', label: 'Color', description: 'Shop tones that match outfits and personal style.' },
  { key: 'price', label: 'Price', description: 'Quick ranges for gifting budgets and self-purchase.' },
];

const PRICE_BUCKETS = [
  { slug: 'under-2500', label: 'Under NPR 2,500', match: (product: JewelryProduct) => product.price < 2500 },
  { slug: '2500-5000', label: 'NPR 2,500 - 5,000', match: (product: JewelryProduct) => product.price >= 2500 && product.price <= 5000 },
  { slug: '5000-10000', label: 'NPR 5,000 - 10,000', match: (product: JewelryProduct) => product.price > 5000 && product.price <= 10000 },
  { slug: 'above-10000', label: 'Above NPR 10,000', match: (product: JewelryProduct) => product.price > 10000 },
];

export function formatProductLabel(value: string | undefined) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function slugifyValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

export function getProductHref(productId: string) {
  return `/products/${encodeURIComponent(productId)}`;
}

function getFacetValues(product: JewelryProduct, facet: ShopFacetKey) {
  switch (facet) {
    case 'occasion':
      return product.occasions?.length ? product.occasions : product.occasion ? [product.occasion] : [];
    case 'recipient':
      return product.recipients || [];
    case 'style':
      return product.styles || [];
    case 'metal': {
      const values = [product.material];
      if (product.plating) values.push(product.plating);
      if (product.metalTone) values.push(product.metalTone);
      return values.filter(Boolean) as string[];
    }
    case 'color':
      return product.colors || [];
    case 'price':
      return PRICE_BUCKETS.filter(bucket => bucket.match(product)).map(bucket => bucket.label);
    default:
      return [];
  }
}

export function getFacetOptions(products: JewelryProduct[], facet: ShopFacetKey, limit?: number): ShopFacetOption[] {
  if (facet === 'price') {
    const priceOptions = PRICE_BUCKETS.map(bucket => ({
      label: bucket.label,
      slug: bucket.slug,
      count: products.filter(bucket.match).length,
    })).filter(option => option.count > 0);

    return typeof limit === 'number' ? priceOptions.slice(0, limit) : priceOptions;
  }

  const counts = new Map<string, { label: string; count: number }>();

  for (const product of products) {
    for (const rawValue of getFacetValues(product, facet)) {
      const label = formatProductLabel(rawValue);
      const slug = slugifyValue(rawValue);
      if (!label || !slug) continue;

      const current = counts.get(slug);
      counts.set(slug, {
        label,
        count: (current?.count || 0) + 1,
      });
    }
  }

  const options = Array.from(counts.entries())
    .map(([slug, value]) => ({ slug, label: value.label, count: value.count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

  return typeof limit === 'number' ? options.slice(0, limit) : options;
}

export function matchesFacet(product: JewelryProduct, facet: ShopFacetKey, slug: string) {
  if (facet === 'price') {
    return PRICE_BUCKETS.some(bucket => bucket.slug === slug && bucket.match(product));
  }

  return getFacetValues(product, facet).some(value => slugifyValue(value) === slug);
}

export function getProductsByFacet(products: JewelryProduct[], facet: ShopFacetKey, slug: string) {
  return products.filter(product => matchesFacet(product, facet, slug));
}

export function getExplicitBundleProducts(products: JewelryProduct[], product: JewelryProduct) {
  if (!product.bundleIds?.length) return [];

  return product.bundleIds
    .map(bundleId => products.find(item => item.id === bundleId))
    .filter(Boolean) as JewelryProduct[];
}

export function getSimilarProducts(products: JewelryProduct[], product: JewelryProduct, limit = 4) {
  return products
    .filter(item => item.id !== product.id)
    .map(item => {
      let score = 0;
      if (item.category === product.category) score += 4;
      if (item.material === product.material) score += 3;
      if (product.occasions?.some(occasion => item.occasions?.includes(occasion) || item.occasion === occasion)) score += 2;
      if (product.styles?.some(style => item.styles?.includes(style))) score += 2;
      if (product.tags?.some(tag => item.tags?.includes(tag))) score += 1;
      return { item, score };
    })
    .filter(entry => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.item.price - right.item.price)
    .slice(0, limit)
    .map(entry => entry.item);
}
