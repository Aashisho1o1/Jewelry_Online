import { JewelryProduct } from '../types/jewelry';
import { parseFrontmatter } from '../utils/markdown-parser';

// No hardcoded products - everything comes from CMS
// This ensures your website only shows YOUR actual products

// Interface for CMS product data structure
interface CMSProduct {
  name: string;
  id: string;
  description: string;
  price: {
    original?: number;
    current: number;
    discount?: number;
  };
  images: {
    main: string;
    gallery?: Array<{ image: string }>;
    lifestyle?: Array<{ image: string }>;
  };
  category: string;
  specifications: {
    material: string;
    weight?: number;
    dimensions?: string;
    stone?: string;
    finish?: string;
  };
  availability: {
    inStock: boolean;
    stockCount?: number;
    preOrder?: boolean;
    estimatedDelivery?: string;
  };
  featured?: boolean;
  trending?: boolean;
  newArrival?: boolean;
  bestSeller?: boolean;
  style?: string[];
  occasions?: string[];
  targetAge?: string;
  tags?: string[];
  seo?: {
    slug?: string;
    metaTitle?: string;
    metaDescription?: string;
  };
}

// Transform CMS product to website product format
function transformCMSProduct(cmsProduct: CMSProduct): JewelryProduct {
  return {
    id: cmsProduct.id,
    name: cmsProduct.name,
    description: cmsProduct.description,
    price: cmsProduct.price.current,
    originalPrice: cmsProduct.price.original,
    image: cmsProduct.images.main,
    category: cmsProduct.category as JewelryProduct['category'],
    material: cmsProduct.specifications.material as JewelryProduct['material'],
    inStock: cmsProduct.availability.inStock,
    featured: cmsProduct.featured || false,
    isNew: cmsProduct.newArrival || false,
  };
}

// Simple transform function for our CMS frontmatter format
function transformFrontmatterProduct(attributes: Record<string, any>): JewelryProduct {
  // CRITICAL FIX: Ensure image paths are correctly resolved
  let imageUrl = attributes.image || '/images/jewelry/placeholder.jpg';
  
  // Normalize image paths to ensure consistency
  if (imageUrl && !imageUrl.startsWith('/')) {
    imageUrl = `/images/jewelry/${imageUrl}`;
  }
  
  // Validate image URL format
  if (!imageUrl.includes('/images/jewelry/')) {
    console.warn(`⚠️ PRODUCT LOADER: Image path may be incorrect: ${imageUrl}`);
    // Fix common path issues
    if (imageUrl.startsWith('/images/') && !imageUrl.includes('/jewelry/')) {
      imageUrl = imageUrl.replace('/images/', '/images/jewelry/');
    }
  }
  
  return {
    id: attributes.id || 'unknown',
    name: attributes.name || 'Unnamed Product',
    description: attributes.description || '',
    price: attributes.price || 0,
    originalPrice: attributes.originalPrice,
    image: imageUrl,
    category: attributes.category || 'rings',
    material: attributes.material || '925_silver',
    inStock: attributes.inStock !== false, // Default to true
    featured: attributes.featured || false,
    isNew: attributes.isNew || false,
  };
}

// This function is deprecated - we now use API integration
// Keeping for backward compatibility but it returns empty array
async function loadCMSProducts(): Promise<JewelryProduct[]> {
  console.log('⚠️ loadCMSProducts is deprecated - use API integration instead');
  return [];
}

// Pure CMS product loader - no hardcoded fallbacks
async function loadProducts(): Promise<JewelryProduct[]> {
  try {
    console.log('🔍 PRODUCT LOADER: Loading products from CMS API...');
    
    const response = await fetch('/api/products');
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const apiProducts = await response.json();
    console.log('🔍 PRODUCT LOADER: API Response received:', apiProducts);
    
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
    
    console.log(`✅ PRODUCT LOADER: Successfully loaded ${validProducts.length} products from CMS`);
    
    if (validProducts.length > 0) {
      console.log('✅ PRODUCT LOADER: Product names:', validProducts.map(p => p.name));
    }
    
    return validProducts; // Return empty array if no products - this is honest!
    
  } catch (error) {
    console.error('❌ PRODUCT LOADER: Failed to load products from CMS:', error);
    
    // Return empty array instead of fake products
    // The UI should handle empty state gracefully
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
    console.log('🔄 PRODUCT LOADER: Cache miss or expired, loading fresh products...');
    cachedProducts = await loadProducts();
    cacheTimestamp = now;
  } else {
    console.log('✅ PRODUCT LOADER: Using cached products');
  }
  
  return cachedProducts;
}

// Function to clear cache (useful for CMS updates)
export function clearProductCache(): void {
  console.log('🗑️ PRODUCT LOADER: Clearing product cache');
  cachedProducts = null;
  cacheTimestamp = 0;
}

// Helper functions for async product filtering
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

// Legacy aliases for compatibility
export const getBestSellers = getFeaturedProducts;
export const getNewArrivals = getNewProducts;