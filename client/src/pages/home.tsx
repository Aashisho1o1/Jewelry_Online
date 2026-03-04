import React, { useEffect, useState } from 'react';
import { ArrowRight, Gift, MessageCircle, ShieldCheck, Star, Truck } from 'lucide-react';
import { Link } from 'wouter';
import { JewelryProduct } from '../types/jewelry';
import { getProducts } from '../data/product-loader';
import ProductCard from '../components/jewelry/ProductCard';
import { useCartContext } from '../contexts/CartContext';
import { useToast } from '../hooks/use-toast';
import homeContent from '../content/home.json';
import TrustStrip from '../components/TrustStrip';
import StoreRateStrip from '../components/StoreRateStrip';
import FlashSaleBanner from '../components/FlashSaleBanner';
import { getFacetOptions } from '@/lib/product-taxonomy';
import SiteMeta from '@/components/SiteMeta';

const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: 'Aashish Jewellers',
  url: 'https://www.aashish.website',
  image: 'https://www.aashish.website/icons/icon-512.png',
  description: 'Premium 925 silver jewelry handcrafted in Nepal - rings, necklaces, earrings, bracelets and traditional sets.',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Butwal',
    addressCountry: 'NP',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    telephone: '+977-981-1469486',
    availableLanguage: ['Nepali', 'English'],
  },
  sameAs: ['https://www.facebook.com/aashishjewellery'],
};

const PREFERRED_CATEGORY_ORDER = [
  'rings', 'necklaces', 'earrings', 'bracelets', 'sets',
  'tilahari', 'mangalsutra', 'sikri', 'baala', 'bulaki',
  'pote', 'pauju', 'maang-tika', 'haar', 'dhungri',
];

const CATEGORY_LABELS: Record<string, string> = {
  'maang-tika': 'Maang Tika',
};

const CATEGORY_COPY: Record<string, string> = {
  rings: 'Easy everyday pieces and gift-friendly styles.',
  necklaces: 'Layering chains and simple statement looks.',
  earrings: 'Fast gifting options with strong visual appeal.',
  bracelets: 'Light, wearable pieces for daily styling.',
  sets: 'Ready-made combinations for bigger occasions.',
};

function formatCategoryName(category: string) {
  if (CATEGORY_LABELS[category]) return CATEGORY_LABELS[category];
  return category
    .split(/[-_]/g)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<JewelryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem, openCart } = useCartContext();
  const { toast } = useToast();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setError(null);
        const cmsProducts = await getProducts();
        setProducts(cmsProducts);
      } catch (loadError) {
        console.error('Failed to load products:', loadError);
        setError('Unable to load products. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleAddToCart = (product: JewelryProduct) => {
    if (!product.inStock) {
      toast({ title: 'Out of Stock', description: 'This item is currently out of stock.', variant: 'destructive' });
      return;
    }
    addItem(product);
    toast({ title: 'Added to bag', description: `${product.name} added to your cart.` });
    setTimeout(() => openCart(), 500);
  };

  const scrollToSection = (sectionId: string) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const categoryCounts = products.reduce((counts, product) => {
    const key = String(product.category || '').trim().toLowerCase();
    if (!key) return counts;
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  const knownCategories = PREFERRED_CATEGORY_ORDER
    .filter(c => categoryCounts[c] > 0)
    .map(c => ({ id: c, name: formatCategoryName(c), count: categoryCounts[c] }));

  const unknownCategories = Object.keys(categoryCounts)
    .filter(c => !PREFERRED_CATEGORY_ORDER.includes(c))
    .sort()
    .map(c => ({ id: c, name: formatCategoryName(c), count: categoryCounts[c] }));

  const allCategories = [...knownCategories, ...unknownCategories];
  const categories = [{ id: 'all', name: 'All', count: products.length }, ...allCategories];

  useEffect(() => {
    if (activeCategory !== 'all' && !categories.some(c => c.id === activeCategory)) {
      setActiveCategory('all');
    }
  }, [activeCategory, categories]);

  const displayProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

  const bestSellerProducts = (products.filter(p => p.featured).length > 0
    ? products.filter(p => p.featured)
    : products).slice(0, 4);

  const spotlightProduct = bestSellerProducts[0];
  const spotlightImages = spotlightProduct
    ? [spotlightProduct.image, ...(spotlightProduct.images || [])].filter(Boolean)
    : [];
  const spotlightAccentImage = spotlightImages.find(img => img !== spotlightImages[0]);

  const silverCount = products.filter(p => p.material.toLowerCase().includes('silver')).length;
  const occasionOptions = getFacetOptions(products, 'occasion', 3);
  const recipientOptions = getFacetOptions(products, 'recipient', 3);
  const priceOptions = getFacetOptions(products, 'price', 3);

  const categoryHighlights = allCategories.slice(0, 4).map(category => {
    const leadProduct = products.find(p => p.category?.toLowerCase() === category.id);
    const gallery = leadProduct ? [leadProduct.image, ...(leadProduct.images || [])].filter(Boolean) : [];
    return {
      ...category,
      image: gallery[0] || homeContent.hero.heroImage || homeContent.imageUrl,
      copy: CATEGORY_COPY[category.id] || 'Simple, giftable pieces.',
    };
  });

  const customerQuotes = products
    .flatMap(p => (p.reviews || []).map(r => ({ ...r, productName: p.name })))
    .slice(0, 3);

  const quickGuides = [
    {
      title: 'By occasion',
      links: occasionOptions.map(o => ({ label: o.label, href: `/shop-by/occasion/${o.slug}` })),
    },
    {
      title: 'By recipient',
      links: recipientOptions.map(o => ({ label: o.label, href: `/shop-by/recipient/${o.slug}` })),
    },
    {
      title: 'By budget',
      links: priceOptions.map(o => ({ label: o.label, href: `/shop-by/price/${o.slug}` })),
    },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] pt-16 md:pt-[72px]">
      <SiteMeta
        title="Aashish Jewellers | Premium Silver Jewelry from Nepal"
        description="Discover handcrafted 925 silver rings, necklaces, earrings and bracelets. Free delivery in Butwal and Bhairahawa. Shop the collection now."
        jsonLd={ORG_JSON_LD}
      />

      {/* ── Hero ── */}
      <section className="border-b border-stone-200 bg-white">
        <div className="container py-12 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-400">{homeContent.brand.name}</p>
              <h1 className="mt-4 text-4xl font-serif font-light leading-tight text-stone-950 md:text-6xl">
                {homeContent.hero.mainTitle || homeContent.title}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-stone-500 font-light">
                {homeContent.hero.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => scrollToSection('catalog')}
                  className="inline-flex items-center justify-center gap-2 bg-stone-950 px-7 py-3.5 text-xs uppercase tracking-[0.18em] text-white transition-colors hover:bg-stone-800"
                >
                  Shop collection
                  <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </button>
                <Link
                  href="/shop-by"
                  className="inline-flex items-center justify-center border border-stone-300 px-7 py-3.5 text-xs uppercase tracking-[0.18em] text-stone-800 transition-colors hover:border-stone-900"
                >
                  Gift guide
                </Link>
              </div>

              {/* Trust row */}
              <div className="mt-8 flex flex-wrap gap-5 text-sm text-stone-500">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-stone-400" strokeWidth={1.5} />
                  925 certified silver
                </span>
                <span className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-stone-400" strokeWidth={1.5} />
                  Gift-ready packaging
                </span>
                <span className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-stone-400" strokeWidth={1.5} />
                  Delivery across Nepal
                </span>
              </div>

              {silverCount > 0 && (
                <p className="mt-5 text-sm text-stone-400">{silverCount}+ handcrafted pieces available</p>
              )}
            </div>

            {/* Hero image + spotlight */}
            <div className="flex flex-col gap-4">
              <img
                src={homeContent.hero.heroImage || homeContent.imageUrl}
                alt="Aashish Jewellers featured collection"
                className="aspect-[3/2] w-full object-cover md:aspect-[4/5]"
                loading="eager"
                fetchPriority="high"
              />
              {spotlightProduct && (
                <div className="hidden items-center gap-4 border border-stone-200 bg-white px-4 py-4 md:flex">
                  <img
                    src={spotlightAccentImage || spotlightProduct.image}
                    alt={spotlightProduct.name}
                    className="h-14 w-14 shrink-0 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-base text-stone-900">{spotlightProduct.name}</p>
                    <p className="text-sm text-stone-500">NPR {spotlightProduct.price.toLocaleString()}</p>
                  </div>
                  <Link
                    href={`/products/${encodeURIComponent(spotlightProduct.id)}`}
                    className="shrink-0 border border-stone-300 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-stone-700 transition-colors hover:border-stone-900"
                  >
                    View
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <FlashSaleBanner />
      <StoreRateStrip />

      <TrustStrip />

      {/* ── Collections ── */}
      <section id="collections" className="scroll-mt-32 py-16">
        <div className="container">
          <div className="mb-8">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Collections</p>
            <h2 className="mt-2 text-3xl font-serif font-light text-stone-950 md:text-4xl">Shop by category</h2>
          </div>

          {categoryHighlights.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {categoryHighlights.map(category => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => { setActiveCategory(category.id); scrollToSection('catalog'); }}
                  className="group overflow-hidden border border-stone-200 bg-white text-left transition-shadow hover:shadow-sm"
                >
                  <div className="overflow-hidden">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="aspect-[4/5] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4">
                    <p className="font-serif text-lg font-light text-stone-950">{category.name}</p>
                    <p className="mt-1 text-sm text-stone-500">{category.copy}</p>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-stone-400">{category.count} pieces</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-stone-500">
              Categories will appear as products are added.
            </div>
          )}
        </div>
      </section>

      {/* ── Bestsellers ── */}
      <section id="bestsellers" className="scroll-mt-32 border-y border-stone-200 bg-white py-16">
        <div className="container">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Best sellers</p>
              <h2 className="mt-2 text-3xl font-serif font-light text-stone-950 md:text-4xl">Most loved pieces</h2>
            </div>
            <button
              type="button"
              onClick={() => scrollToSection('catalog')}
              className="inline-flex items-center gap-2 text-sm text-stone-600 underline underline-offset-4 hover:text-stone-900"
            >
              Browse all
              <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>

          {bestSellerProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:gap-6 xl:grid-cols-4">
              {bestSellerProducts.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center text-stone-500">
              Best sellers will appear here once products are available.
            </div>
          )}
        </div>
      </section>

      {/* ── Gift guide strip ── */}
      <section className="py-16">
        <div className="container grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="border border-stone-200 bg-white p-6">
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Gift guide</p>
            <h2 className="mt-3 text-2xl font-serif font-light text-stone-950">
              Know the occasion — not the product?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Start with who you&apos;re buying for or what budget you have.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Link
                href="/shop-by"
                className="inline-flex items-center justify-center bg-stone-950 px-6 py-3 text-xs uppercase tracking-[0.18em] text-white transition-colors hover:bg-stone-800"
              >
                Open gift guide
              </Link>
              <a
                href="https://wa.me/9779811469486?text=Hi%2C%20I%20need%20help%20choosing%20a%20gift."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center border border-stone-300 px-6 py-3 text-xs uppercase tracking-[0.18em] text-stone-800 transition-colors hover:border-stone-900"
              >
                Ask on WhatsApp
              </a>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {quickGuides.map(guide => (
              <div key={guide.title} className="border border-stone-200 bg-white p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-stone-400 mb-4">{guide.title}</p>
                <div className="flex flex-col gap-2">
                  {guide.links.length > 0 ? (
                    guide.links.map(link => (
                      <Link
                        key={`${guide.title}-${link.label}`}
                        href={link.href}
                        className="text-sm text-stone-700 hover:text-stone-950 transition-colors"
                      >
                        {link.label} →
                      </Link>
                    ))
                  ) : (
                    <Link href="/shop-by" className="text-sm text-stone-700 hover:text-stone-950">
                      Browse →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Full catalog ── */}
      <section id="catalog" className="scroll-mt-32 border-y border-stone-200 bg-white py-16">
        <div className="container">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Catalog</p>
              <h2 className="mt-2 text-3xl font-serif font-light text-stone-950 md:text-4xl">Full collection</h2>
            </div>
            <p className="text-sm text-stone-400">
              {displayProducts.length} of {products.length} pieces
            </p>
          </div>

          {/* Category filters */}
          <div className="mb-8 flex gap-2 overflow-x-auto pb-2 sm:flex-wrap">
            {categories.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`shrink-0 border px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors ${
                  activeCategory === category.id
                    ? 'border-stone-950 bg-stone-950 text-white'
                    : 'border-stone-300 bg-white text-stone-600 hover:border-stone-950 hover:text-stone-950'
                }`}
              >
                {category.name}
                <span className="ml-1.5 opacity-60">({category.count})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-stone-900" />
            </div>
          ) : error ? (
            <div className="border border-red-200 bg-red-50 px-6 py-10 text-center">
              <p className="text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 inline-flex bg-stone-950 px-6 py-3 text-xs uppercase tracking-[0.16em] text-white"
              >
                Retry
              </button>
            </div>
          ) : displayProducts.length === 0 ? (
            <div className="border border-dashed border-stone-300 bg-stone-50 px-6 py-10 text-center text-stone-500">
              <p>
                {products.length === 0
                  ? 'The collection is being prepared. Please check back soon.'
                  : `No products in "${activeCategory}".`}
              </p>
              {activeCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('all')}
                  className="mt-4 text-xs uppercase tracking-[0.14em] text-stone-900 underline underline-offset-4"
                >
                  View all
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
              {displayProducts.map((product: JewelryProduct) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Reviews ── */}
      {customerQuotes.length > 0 && (
        <section className="py-16">
          <div className="container">
            <div className="mb-8">
              <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Reviews</p>
              <h2 className="mt-2 text-3xl font-serif font-light text-stone-950 md:text-4xl">What customers say</h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {customerQuotes.map((quote, index) => (
                <div key={`${quote.author}-${index}`} className="border border-stone-200 bg-white p-6">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < Math.round(quote.rating) ? 'fill-current' : ''}`}
                        strokeWidth={1}
                      />
                    ))}
                  </div>
                  {quote.title && <p className="mt-4 font-medium text-stone-900">{quote.title}</p>}
                  <p className="mt-3 text-sm leading-relaxed text-stone-600">{quote.text}</p>
                  <div className="mt-5 border-t border-stone-100 pt-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-stone-700">{quote.author}</p>
                    <p className="mt-0.5 text-xs text-stone-400">{quote.productName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Help CTA ── */}
      <section className="border-t border-stone-200 bg-stone-900 py-16">
        <div className="container">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-serif font-light text-white md:text-4xl">Need help choosing?</h2>
              <p className="mt-3 text-stone-400 font-light">
                Questions about sizing, gifting, or delivery? We reply on WhatsApp within minutes.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href="https://wa.me/9779811469486?text=Hi%2C%20I%20need%20help%20choosing%20jewelry."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3.5 text-xs uppercase tracking-[0.18em] text-stone-900 transition-colors hover:bg-stone-100"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                Chat on WhatsApp
              </a>
              <Link
                href="/about"
                className="inline-flex items-center justify-center border border-white/20 px-6 py-3.5 text-xs uppercase tracking-[0.18em] text-white transition-colors hover:border-white/60"
              >
                Our story
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
