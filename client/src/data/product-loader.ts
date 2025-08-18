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

// Load CMS products from markdown files
async function loadCMSProducts(): Promise<CMSProduct[]> {
  const products: CMSProduct[] = [];
  
  try {
    // For now, we'll manually import the sample CMS product
    // In a real build system, this would be handled by the bundler
    const sampleCMSProductContent = `---
name: "Elegant Silver Ring"
id: "CMS001"
description: "Beautiful handcrafted silver ring with intricate design"
price:
  original: 3000
  current: 2500
  discount: 17
images:
  main: "/images/jewelry/ring-1.jpg"
category: "rings"
specifications:
  material: "925_silver"
  weight: 5.2
  dimensions: "Size adjustable"
  finish: "polished"
availability:
  inStock: true
  stockCount: 15
featured: true
newArrival: false
bestSeller: true
---

This elegant silver ring showcases the finest craftsmanship.`;

    const parsed = parseFrontmatter(sampleCMSProductContent);
    if (parsed.attributes && parsed.attributes.name) {
      products.push(parsed.attributes as CMSProduct);
    }
    
  } catch (error) {
    console.warn('Failed to load CMS products:', error);
  }
  
  return products;
}

// Dynamic product loader
async function loadProducts(): Promise<JewelryProduct[]> {
  try {
    // Try to load CMS products dynamically
    const cmsProducts = await loadCMSProducts();
    
    if (cmsProducts.length > 0) {
      console.log(`Loaded ${cmsProducts.length} products from CMS`);
      const transformedProducts = cmsProducts.map(transformCMSProduct);
      // Combine CMS products with sample products for now
      return [...transformedProducts, ...sampleProducts];
    }
    
    // Fallback to sample products
    console.log('No CMS products found, using sample products');
    return sampleProducts;
    
  } catch (error) {
    console.warn('Error loading CMS products, using sample products:', error);
    return sampleProducts;
  }
}

// Export the main products array (this will be used by the website)
let cachedProducts: JewelryProduct[] | null = null;

export async function getProducts(): Promise<JewelryProduct[]> {
  if (cachedProducts === null) {
    cachedProducts = await loadProducts();
  }
  return cachedProducts;
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