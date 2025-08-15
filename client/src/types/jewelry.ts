// Minimal Jewelry Types - Just what Aashish Jewellers actually needs
export interface JewelryProduct {
  id: string;
  name: string;
  description: string;
  price: number; // Just the current price in NPR
  originalPrice?: number; // Only if there's a discount
  image: string; // Just one main image
  category: 'rings' | 'necklaces' | 'earrings' | 'bracelets' | 'sets';
  material: '925_silver' | 'gold_plated' | 'rose_gold_plated';
  inStock: boolean;
  featured?: boolean;
  isNew?: boolean;
}

// Simple category type
export type JewelryCategory = JewelryProduct['category'];

// Basic cart item
export interface CartItem {
  productId: string;
  quantity: number;
}