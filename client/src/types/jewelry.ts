// Jewelry product model loaded from CMS markdown files.
export interface JewelryProduct {
  id: string;
  name: string;
  description: string;
  price: number; // Current price in NPR
  originalPrice?: number; // Optional compare-at price
  image: string; // Primary image used in cards
  images?: string[]; // Optional gallery images
  category: string; // Category slugs are CMS-driven
  material: string; // Material slugs are CMS-driven
  inStock: boolean;
  featured?: boolean;
  isNew?: boolean;
  weight?: string;
  dimensions?: string;
  stoneType?: string;
  occasion?: string;
}

// Simple category type
export type JewelryCategory = JewelryProduct['category'];

// Basic cart item
export interface CartItem {
  productId: string;
  quantity: number;
}
