// Jewelry Business Types - Inspired by successful brands like Giva
export interface JewelryProduct {
  id: string;
  name: string;
  description: string;
  price: {
    original: number;
    current: number;
    currency: "NPR";
    discount?: number;
  };
  images: {
    main: string;
    gallery: string[];
    lifestyle?: string[];
  };
  category: JewelryCategory;
  subcategory?: string;
  specifications: {
    material: "925_silver" | "silver_gold_plated" | "silver_rose_gold_plated";
    weight: number; // in grams
    dimensions?: string;
    stone?: string;
    finish: "polished" | "oxidized" | "matte" | "textured";
  };
  features: {
    hypoallergenic: boolean;
    nickelFree: boolean;
    tarnishResistant: boolean;
    adjustable?: boolean;
  };
  availability: {
    inStock: boolean;
    stockCount?: number;
    preOrder?: boolean;
    estimatedDelivery?: string;
  };
  style: JewelryStyle[];
  occasions: JewelryOccasion[];
  targetAge: "teens" | "young_adults" | "adults" | "all";
  tags: string[];
  seo: {
    slug: string;
    metaTitle: string;
    metaDescription: string;
  };
  ratings?: {
    average: number;
    count: number;
  };
  featured: boolean;
  trending: boolean;
  newArrival: boolean;
  bestSeller: boolean;
  createdAt: string;
  updatedAt: string;
}

export type JewelryCategory = 
  | "rings"
  | "necklaces"
  | "earrings"
  | "bracelets"
  | "bangles"
  | "pendants"
  | "anklets"
  | "nose_pins"
  | "toe_rings"
  | "sets";

export type JewelryStyle = 
  | "minimalist"
  | "traditional"
  | "contemporary"
  | "bohemian"
  | "vintage"
  | "geometric"
  | "floral"
  | "statement"
  | "delicate"
  | "chunky";

export type JewelryOccasion = 
  | "daily_wear"
  | "office"
  | "party"
  | "wedding"
  | "festival"
  | "casual"
  | "formal"
  | "gift"
  | "special_occasion";

export interface ProductFilter {
  category?: JewelryCategory[];
  priceRange?: {
    min: number;
    max: number;
  };
  material?: string[];
  style?: JewelryStyle[];
  occasion?: JewelryOccasion[];
  inStock?: boolean;
  sortBy?: "price_low" | "price_high" | "newest" | "popular" | "rating";
}

export interface CartItem {
  productId: string;
  product: JewelryProduct;
  quantity: number;
  selectedOptions?: {
    size?: string;
    customization?: string;
  };
  addedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    district: string;
    zone: string;
    postalCode?: string;
  };
  preferences?: {
    style: JewelryStyle[];
    budget: {
      min: number;
      max: number;
    };
    notifications: boolean;
  };
}

export interface Order {
  id: string;
  customerId: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  paymentMethod: "esewa" | "khalti" | "imepay" | "cod" | "bank_transfer";
  shippingAddress: Customer["address"];
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}