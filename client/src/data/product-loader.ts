import { JewelryProduct } from '../types/jewelry';
import { parseFrontmatter } from '../utils/markdown-parser';

// Sample products as fallback
const sampleProducts: JewelryProduct[] = [
  {
    id: "NS001",
    name: "Silver Chain Necklace",
    description: "Beautiful 925 silver chain necklace, perfect for daily wear.",
    price: 2800,
    originalPrice: 3500,
    image: "/images/jewelry/necklace-1.jpg",
    category: "necklaces",
    material: "925_silver",
    inStock: true,
    featured: true,
  },
  {
    id: "ER002", 
    name: "Rose Gold Hoop Earrings",
    description: "Trendy rose gold plated hoops for a modern look.",
    price: 1980,
    originalPrice: 2200,
    image: "/images/jewelry/earrings-1.jpg",
    category: "earrings",
    material: "rose_gold_plated", 
    inStock: true,
    isNew: true,
  },
  {
    id: "RG003",
    name: "Infinity Symbol Ring", 
    description: "Delicate infinity ring representing eternal love.",
    price: 1800,
    image: "/images/jewelry/ring-1.jpg",
    category: "rings",
    material: "925_silver",
    inStock: true,
    featured: true,
  },
  {
    id: "BR004",
    name: "Silver Charm Bracelet",
    description: "Customizable charm bracelet to tell your story.",
    price: 3360,
    originalPrice: 4200,
    image: "/images/jewelry/bracelet-1.jpg", 
    category: "bracelets",
    material: "925_silver",
    inStock: true,
  },
  {
    id: "ST005",
    name: "Heritage Jewelry Set",
    description: "Complete set with necklace, earrings, and bracelet.",
    price: 6800,
    originalPrice: 8500,
    image: "/images/jewelry/set-1.jpg",
    category: "sets", 
    material: "925_silver",
    inStock: true,
    featured: true,
  }
];

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
  return {
    id: attributes.id || 'unknown',
    name: attributes.name || 'Unnamed Product',
    description: attributes.description || '',
    price: attributes.price || 0,
    originalPrice: attributes.originalPrice,
    image: attributes.image || '/images/jewelry/placeholder.jpg',
    category: attributes.category || 'rings',
    material: attributes.material || '925_silver',
    inStock: attributes.inStock !== false, // Default to true
    featured: attributes.featured || false,
    isNew: attributes.isNew || false,
  };
}

// Load CMS products - simplified for build compatibility
async function loadCMSProducts(): Promise<JewelryProduct[]> {
  const products: JewelryProduct[] = [];
  
  try {
    // In a client-side app, we can't directly read files from content/jewelry/
    // This would need to be handled by the build process or API
    // For now, we'll return the sample products with a note that CMS integration
    // requires server-side rendering or build-time processing
    
    console.log('CMS product loading requires build-time processing or API integration');
    return sampleProducts;
    
  } catch (error) {
    console.warn('Failed to load CMS products:', error);
    return sampleProducts;
  }
}

// Dynamic product loader with API integration
async function loadProducts(): Promise<JewelryProduct[]> {
  try {
    console.log('🔍 PRODUCT LOADER: Attempting to load products from CMS API...');
    
    // Try to fetch products from our API endpoint
    const response = await fetch('/api/products');
    
    if (response.ok) {
      const apiProducts = await response.json();
      console.log('🔍 PRODUCT LOADER: API Response received:', apiProducts);
      
      if (Array.isArray(apiProducts) && apiProducts.length > 0) {
        console.log(`✅ PRODUCT LOADER: Successfully loaded ${apiProducts.length} products from CMS`);
        console.log('✅ PRODUCT LOADER: Product names:', apiProducts.map(p => p.name));
        
        // Validate product structure
        const validProducts = apiProducts.filter(product => 
          product.id && product.name && typeof product.price === 'number'
        );
        
        if (validProducts.length > 0) {
          console.log(`✅ PRODUCT LOADER: ${validProducts.length} valid products found`);
          return validProducts;
        }
      }
    } else {
      console.warn('⚠️ PRODUCT LOADER: API request failed with status:', response.status);
    }
    
    console.log('⚠️ PRODUCT LOADER: No valid CMS products found, using sample products as fallback');
    return sampleProducts;
    
  } catch (error) {
    console.error('❌ PRODUCT LOADER: Error loading products from API:', error);
    console.log('⚠️ PRODUCT LOADER: Falling back to sample products');
    return sampleProducts;
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

// Synchronous version for immediate use (returns sample data initially)
export const sampleJewelryProducts = sampleProducts;

// Helper functions (maintain compatibility with existing code)
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

// Synchronous versions for backward compatibility
export const getFeaturedProductsSync = () => 
  sampleProducts.filter(product => product.featured);

export const getNewProductsSync = () => 
  sampleProducts.filter(product => product.isNew);

export const getProductsByCategorySync = (category: string) =>
  sampleProducts.filter(product => product.category === category);

// Legacy aliases for compatibility
export const getBestSellers = getFeaturedProducts;
export const getNewArrivals = getNewProducts;
export const getBestSellersSync = getFeaturedProductsSync;
export const getNewArrivalsSync = getNewProductsSync;