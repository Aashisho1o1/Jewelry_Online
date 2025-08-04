import { JewelryProduct } from '../types/jewelry';

// Minimal sample products for Aadarsh Jewellers
export const sampleJewelryProducts: JewelryProduct[] = [
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

// Helper functions
export const getFeaturedProducts = () => 
  sampleJewelryProducts.filter(product => product.featured);

export const getNewProducts = () => 
  sampleJewelryProducts.filter(product => product.isNew);

export const getProductsByCategory = (category: string) =>
  sampleJewelryProducts.filter(product => product.category === category);

export const getDiscountedProducts = () =>
  sampleJewelryProducts.filter(product => product.originalPrice);

// Legacy aliases for compatibility
export const getBestSellers = getFeaturedProducts;
export const getNewArrivals = getNewProducts;