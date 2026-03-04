export interface ProductReview {
  author: string;
  rating: number;
  text: string;
  title?: string;
  image?: string;
  verified?: boolean;
}

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
  priceMode?: 'manual' | 'live_metal';
  metalRateKey?: string;
  pricingWeightGrams?: number;
  priceRoundingIncrement?: number;
  priceSource?: 'manual' | 'market_rate';
  currentMetalRate?: number;
  baselineMetalRate?: number;
  priceAdjustment?: number;
  priceUpdatedAt?: string;
  metalRateLabel?: string;
  dimensions?: string;
  stoneType?: string;
  occasion?: string;
  occasions?: string[];
  recipients?: string[];
  styles?: string[];
  colors?: string[];
  tags?: string[];
  highlights?: string[];
  care?: string[];
  plating?: string;
  collection?: string;
  metalTone?: string;
  designStory?: string;
  styleNote?: string;
  sizeGuide?: string;
  fitNotes?: string;
  warranty?: string;
  deliveryEstimate?: string;
  giftWrapAvailable?: boolean;
  giftCardAvailable?: boolean;
  giftMessageSuggestion?: string;
  bundleIds?: string[];
  reviews?: ProductReview[];
  customerPhotos?: string[];
  reviewCount?: number;
  rating?: number;
}

// Simple category type
export type JewelryCategory = JewelryProduct['category'];

// Basic cart item
export interface CartItem {
  productId: string;
  quantity: number;
}
