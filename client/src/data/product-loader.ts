import { JewelryProduct } from '../types/jewelry';

// No hardcoded products - everything comes from CMS
// This ensures your website only shows YOUR actual products

// Pure CMS product loader - no hardcoded fallbacks
async function loadProducts(): Promise<JewelryProduct[]> {
  try {
    const response = await fetch('/api/products');

    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const apiProducts = await response.json();

    if (!Array.isArray(apiProducts)) {
      throw new Error('API returned invalid data format');
    }

    // Validate product structure
    const validProducts = apiProducts.filter(product =>
      product.id &&
      product.name &&
      typeof product.price === 'number' &&
      product.category &&
      product.material
    );

    return validProducts;

  } catch (error) {
    console.error('Failed to load products from CMS:', error);
    return [];
  }
}

// Export the main products array with cache management
let cachedProducts: JewelryProduct[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute cache

export async function getProducts(forceRefresh: boolean = false): Promise<JewelryProduct[]> {
  const now = Date.now();
  const cacheExpired = (now - cacheTimestamp) > CACHE_DURATION;

  if (cachedProducts === null || forceRefresh || cacheExpired) {
    cachedProducts = await loadProducts();
    cacheTimestamp = now;
  }

  return cachedProducts;
}

export function clearProductCache(): void {
  cachedProducts = null;
  cacheTimestamp = 0;
}

export const getFeaturedProducts = async (): Promise<JewelryProduct[]> => {
  const products = await getProducts();
  return products.filter(product => product.featured);
};

export const getNewProducts = async (): Promise<JewelryProduct[]> => {
  const products = await getProducts();
  return products.filter(product => product.isNew);
};

export const getProductsByCategory = async (category: string): Promise<JewelryProduct[]> => {
  const products = await getProducts();
  return products.filter(product => product.category === category);
};

export const getBestSellers = getFeaturedProducts;
export const getNewArrivals = getNewProducts;
