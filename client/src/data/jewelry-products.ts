import { JewelryProduct } from '../types/jewelry';

// Sample Jewelry Products - Inspired by Giva's successful product range
export const sampleJewelryProducts: JewelryProduct[] = [
  {
    id: "NS001",
    name: "Timeless Elegance Silver Necklace",
    description: "A stunning 925 silver necklace featuring delicate chain work perfect for everyday wear. Hypoallergenic and tarnish-resistant.",
    price: {
      original: 3500,
      current: 2800,
      currency: "NPR",
      discount: 20
    },
    images: {
      main: "/images/jewelry/necklace-001-main.jpg",
      gallery: [
        "/images/jewelry/necklace-001-1.jpg",
        "/images/jewelry/necklace-001-2.jpg",
        "/images/jewelry/necklace-001-3.jpg"
      ],
      lifestyle: ["/images/jewelry/necklace-001-lifestyle.jpg"]
    },
    category: "necklaces",
    subcategory: "chain_necklaces",
    specifications: {
      material: "925_silver",
      weight: 8.5,
      dimensions: "16-18 inches adjustable",
      finish: "polished"
    },
    features: {
      hypoallergenic: true,
      nickelFree: true,
      tarnishResistant: true,
      adjustable: true
    },
    availability: {
      inStock: true,
      stockCount: 15
    },
    style: ["minimalist", "contemporary"],
    occasions: ["daily_wear", "office", "casual"],
    targetAge: "young_adults",
    tags: ["925silver", "minimalist", "adjustable", "hypoallergenic", "bestseller"],
    seo: {
      slug: "timeless-elegance-silver-necklace",
      metaTitle: "Timeless Elegance 925 Silver Necklace | Aadarsh Jewellers",
      metaDescription: "Beautiful 925 silver necklace perfect for daily wear. Hypoallergenic, adjustable length. Shop now for NPR 2,800."
    },
    ratings: {
      average: 4.8,
      count: 124
    },
    featured: true,
    trending: true,
    newArrival: false,
    bestSeller: true,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-08-04T00:00:00Z"
  },
  {
    id: "ER002",
    name: "Rose Gold Plated Hoop Earrings",
    description: "Trendy rose gold plated silver hoops that add instant glamour to any outfit. Perfect for young fashion enthusiasts.",
    price: {
      original: 2200,
      current: 1980,
      currency: "NPR",
      discount: 10
    },
    images: {
      main: "/images/jewelry/earrings-002-main.jpg",
      gallery: [
        "/images/jewelry/earrings-002-1.jpg",
        "/images/jewelry/earrings-002-2.jpg"
      ],
      lifestyle: ["/images/jewelry/earrings-002-lifestyle.jpg"]
    },
    category: "earrings",
    subcategory: "hoop_earrings",
    specifications: {
      material: "silver_rose_gold_plated",
      weight: 3.2,
      dimensions: "2.5cm diameter",
      finish: "polished"
    },
    features: {
      hypoallergenic: true,
      nickelFree: true,
      tarnishResistant: true
    },
    availability: {
      inStock: true,
      stockCount: 25
    },
    style: ["contemporary", "statement"],
    occasions: ["party", "casual", "special_occasion"],
    targetAge: "young_adults",
    tags: ["rosegold", "hoops", "trendy", "instagram_worthy"],
    seo: {
      slug: "rose-gold-plated-hoop-earrings",
      metaTitle: "Rose Gold Plated Hoop Earrings | Aadarsh Jewellers",
      metaDescription: "Trendy rose gold plated silver hoop earrings. Perfect for parties and special occasions. Shop for NPR 1,980."
    },
    ratings: {
      average: 4.7,
      count: 89
    },
    featured: true,
    trending: true,
    newArrival: true,
    bestSeller: false,
    createdAt: "2024-07-20T00:00:00Z",
    updatedAt: "2024-08-04T00:00:00Z"
  },
  {
    id: "RG003",
    name: "Infinity Love Ring",
    description: "Delicate infinity symbol ring representing eternal love. Perfect gift for someone special or a treat for yourself.",
    price: {
      original: 1800,
      current: 1800,
      currency: "NPR"
    },
    images: {
      main: "/images/jewelry/ring-003-main.jpg",
      gallery: [
        "/images/jewelry/ring-003-1.jpg",
        "/images/jewelry/ring-003-2.jpg",
        "/images/jewelry/ring-003-3.jpg"
      ]
    },
    category: "rings",
    subcategory: "symbol_rings",
    specifications: {
      material: "925_silver",
      weight: 2.1,
      dimensions: "Sizes 5-9 available",
      finish: "polished"
    },
    features: {
      hypoallergenic: true,
      nickelFree: true,
      tarnishResistant: true
    },
    availability: {
      inStock: true,
      stockCount: 30
    },
    style: ["minimalist", "delicate"],
    occasions: ["daily_wear", "gift", "special_occasion"],
    targetAge: "young_adults",
    tags: ["infinity", "symbol", "gift", "love", "minimalist"],
    seo: {
      slug: "infinity-love-ring-925-silver",
      metaTitle: "Infinity Love Ring 925 Silver | Perfect Gift | Aadarsh Jewellers",
      metaDescription: "Beautiful infinity symbol ring in 925 silver. Perfect gift for loved ones. Available in sizes 5-9. NPR 1,800."
    },
    ratings: {
      average: 4.9,
      count: 156
    },
    featured: false,
    trending: false,
    newArrival: false,
    bestSeller: true,
    createdAt: "2024-02-10T00:00:00Z",
    updatedAt: "2024-08-04T00:00:00Z"
  },
  {
    id: "BR004",
    name: "Charm Bracelet Collection",
    description: "Build your story with our customizable charm bracelet. Start with the base and add meaningful charms over time.",
    price: {
      original: 4200,
      current: 3360,
      currency: "NPR",
      discount: 20
    },
    images: {
      main: "/images/jewelry/bracelet-004-main.jpg",
      gallery: [
        "/images/jewelry/bracelet-004-1.jpg",
        "/images/jewelry/bracelet-004-2.jpg",
        "/images/jewelry/bracelet-004-3.jpg",
        "/images/jewelry/bracelet-004-4.jpg"
      ],
      lifestyle: ["/images/jewelry/bracelet-004-lifestyle.jpg"]
    },
    category: "bracelets",
    subcategory: "charm_bracelets",
    specifications: {
      material: "925_silver",
      weight: 12.3,
      dimensions: "7-8 inches adjustable",
      finish: "polished"
    },
    features: {
      hypoallergenic: true,
      nickelFree: true,
      tarnishResistant: true,
      adjustable: true
    },
    availability: {
      inStock: true,
      stockCount: 8
    },
    style: ["contemporary", "statement"],
    occasions: ["daily_wear", "special_occasion", "gift"],
    targetAge: "young_adults",
    tags: ["charm", "customizable", "story", "personal", "collection"],
    seo: {
      slug: "charm-bracelet-collection-925-silver",
      metaTitle: "Customizable Charm Bracelet | Build Your Story | Aadarsh Jewellers",
      metaDescription: "Create your unique story with our charm bracelet collection. 925 silver base with customizable charms. NPR 3,360."
    },
    ratings: {
      average: 4.6,
      count: 67
    },
    featured: true,
    trending: false,
    newArrival: true,
    bestSeller: false,
    createdAt: "2024-07-15T00:00:00Z",
    updatedAt: "2024-08-04T00:00:00Z"
  },
  {
    id: "PD005",
    name: "Evil Eye Protection Pendant",
    description: "Traditional evil eye design meets modern aesthetics. Believed to protect against negative energy while looking stylish.",
    price: {
      original: 2500,
      current: 2100,
      currency: "NPR",
      discount: 16
    },
    images: {
      main: "/images/jewelry/pendant-005-main.jpg",
      gallery: [
        "/images/jewelry/pendant-005-1.jpg",
        "/images/jewelry/pendant-005-2.jpg"
      ]
    },
    category: "pendants",
    subcategory: "spiritual_pendants",
    specifications: {
      material: "925_silver",
      weight: 4.7,
      dimensions: "1.5cm diameter",
      stone: "Blue cubic zirconia",
      finish: "polished"
    },
    features: {
      hypoallergenic: true,
      nickelFree: true,
      tarnishResistant: true
    },
    availability: {
      inStock: true,
      stockCount: 20
    },
    style: ["traditional", "contemporary"],
    occasions: ["daily_wear", "spiritual", "gift"],
    targetAge: "all",
    tags: ["evil_eye", "protection", "spiritual", "traditional", "meaningful"],
    seo: {
      slug: "evil-eye-protection-pendant-925-silver",
      metaTitle: "Evil Eye Protection Pendant | Traditional Design | Aadarsh Jewellers",
      metaDescription: "Beautiful evil eye pendant in 925 silver. Traditional protection symbol with modern design. NPR 2,100."
    },
    ratings: {
      average: 4.5,
      count: 43
    },
    featured: false,
    trending: true,
    newArrival: false,
    bestSeller: false,
    createdAt: "2024-03-20T00:00:00Z",
    updatedAt: "2024-08-04T00:00:00Z"
  },
  {
    id: "ST006",
    name: "Himalayan Heritage Set",
    description: "Complete jewelry set inspired by Himalayan culture. Includes necklace, earrings, and bracelet with traditional motifs.",
    price: {
      original: 8500,
      current: 6800,
      currency: "NPR",
      discount: 20
    },
    images: {
      main: "/images/jewelry/set-006-main.jpg",
      gallery: [
        "/images/jewelry/set-006-1.jpg",
        "/images/jewelry/set-006-2.jpg",
        "/images/jewelry/set-006-3.jpg",
        "/images/jewelry/set-006-4.jpg"
      ],
      lifestyle: [
        "/images/jewelry/set-006-lifestyle-1.jpg",
        "/images/jewelry/set-006-lifestyle-2.jpg"
      ]
    },
    category: "sets",
    subcategory: "complete_sets",
    specifications: {
      material: "925_silver",
      weight: 35.8,
      dimensions: "Necklace: 18 inches, Earrings: 3cm, Bracelet: 7.5 inches",
      finish: "oxidized"
    },
    features: {
      hypoallergenic: true,
      nickelFree: true,
      tarnishResistant: true
    },
    availability: {
      inStock: true,
      stockCount: 5
    },
    style: ["traditional", "vintage", "statement"],
    occasions: ["wedding", "festival", "special_occasion"],
    targetAge: "adults",
    tags: ["heritage", "traditional", "complete_set", "himalayan", "cultural", "premium"],
    seo: {
      slug: "himalayan-heritage-jewelry-set-925-silver",
      metaTitle: "Himalayan Heritage Jewellery Set | Traditional Design | Aadarsh Jewellers",
      metaDescription: "Complete Himalayan heritage jewelry set in 925 silver. Perfect for weddings and festivals. NPR 6,800."
    },
    ratings: {
      average: 4.9,
      count: 31
    },
    featured: true,
    trending: false,
    newArrival: false,
    bestSeller: true,
    createdAt: "2024-01-05T00:00:00Z",
    updatedAt: "2024-08-04T00:00:00Z"
  }
];

// Helper functions for filtering and sorting
export const getProductsByCategory = (category: string) => {
  return sampleJewelryProducts.filter(product => product.category === category);
};

export const getFeaturedProducts = () => {
  return sampleJewelryProducts.filter(product => product.featured);
};

export const getTrendingProducts = () => {
  return sampleJewelryProducts.filter(product => product.trending);
};

export const getBestSellers = () => {
  return sampleJewelryProducts.filter(product => product.bestSeller);
};

export const getNewArrivals = () => {
  return sampleJewelryProducts.filter(product => product.newArrival);
};

export const getProductsInPriceRange = (min: number, max: number) => {
  return sampleJewelryProducts.filter(
    product => product.price.current >= min && product.price.current <= max
  );
};

export const getProductsByTargetAge = (targetAge: string) => {
  return sampleJewelryProducts.filter(
    product => product.targetAge === targetAge || product.targetAge === "all"
  );
};