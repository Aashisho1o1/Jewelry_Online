import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Gift, ShieldCheck, Star, Truck } from 'lucide-react';
import { JewelryProduct } from '../types/jewelry';
import { getProducts } from '../data/product-loader';
import ProductCard from '../components/jewelry/ProductCard';
import { useCartContext } from '../contexts/CartContext';
import { useToast } from '../hooks/use-toast';
import homeContent from '../content/home.json';
import FlashSaleBanner from '../components/FlashSaleBanner';
import HeroCarousel, { HeroSlide } from '../components/home/HeroCarousel';
import CategoryCircles from '../components/home/CategoryCircles';
import { STORE_CATEGORIES } from '../components/CategorySheet';
import { getFacetOptions, getProductHref } from '@/lib/product-taxonomy';
import SiteMeta, { SITE_URL } from '@/components/SiteMeta';

const ORG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: 'Aashish Jewellers',
  url: SITE_URL,
  image: `${SITE_URL}/icons/icon-512.png`,
  logo: `${SITE_URL}/icons/icon-512.png`,
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

const WHATSAPP = 'https://wa.me/9779811469486';
const ALL_JEWELLERY = '/collections';
const WEDDING_CATEGORIES = STORE_CATEGORIES.filter(c => ['tilahari', 'mangalsutra', 'pote', 'pauju', 'maang-tika'].includes(c.id));
const BUDGET_TONES = ['bg-forest-900 text-white', 'bg-forest-100 text-forest-900', 'bg-cream-card text-stone-900', 'bg-forest-700 text-white'];

// "NPR 2,500 - 5,000" -> pre "NPR 2,500 to", amount "5,000" (tile shows the top of the range large).
function splitBudgetLabel(label: string) {
  const match = label.match(/^(.*?)([\d,]+)$/);
  if (!match) return { pre: '', amount: label };
  return { pre: match[1].trim().replace(/\s-$/, ' to'), amount: match[2] };
}

function SectionHeading({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-[11px] uppercase tracking-[0.22em] text-stone-500">{eyebrow}</p>
        <h2 className="mt-2 font-serif text-[26px] font-normal text-stone-900 md:text-[34px]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<JewelryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem, openCart } = useCartContext();
  const { toast } = useToast();

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(error => console.error('Failed to load products:', error))
      .finally(() => setLoading(false));
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

  // Featured pieces first, then by rating.
  const bestSellers = [...products]
    .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || (b.rating || 0) - (a.rating || 0))
    .slice(0, 6);
  const budgets = getFacetOptions(products, 'price');
  // One review per product so the section isn't all about a single piece.
  const reviews = products
    .filter(p => p.reviews?.length)
    .slice(0, 3)
    .map(p => ({ ...p.reviews![0], product: p }));

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <SiteMeta
        title="Aashish Jewellers | Premium Silver Jewelry from Nepal"
        description="Discover handcrafted 925 silver rings, necklaces, earrings and bracelets. Free delivery in Butwal and Bhairahawa. Shop the collection now."
        jsonLd={ORG_JSON_LD}
      />
      {/* The slides are the visual headline; keep a real h1 for search engines and screen readers. */}
      <h1 className="sr-only">{homeContent.hero.mainTitle}</h1>

      {/* Phone order: categories, best sellers, banner, trust, budget, wedding, reviews, help.
          Desktop order: banner, categories, budget, best sellers, reviews, help. */}
      <div className="order-3 md:order-1">
        <HeroCarousel slides={homeContent.slides as HeroSlide[]} />
      </div>

      <div className="order-4 md:order-2">
        <FlashSaleBanner />
      </div>

      <CategoryCircles products={products} className="order-1 md:order-3" />

      {/* Best sellers */}
      <section className="order-2 mx-auto w-full max-w-[1280px] px-4 pb-2 pt-5 md:order-5 md:px-10 md:pb-0 md:pt-20">
        <div className="mb-3.5 flex items-baseline justify-between gap-3 md:hidden">
          <h2 className="font-serif text-[22px] font-normal text-stone-900">Best sellers</h2>
          <Link href={ALL_JEWELLERY} className="text-[13px] font-medium text-forest-900">View all →</Link>
        </div>
        <div className="hidden md:block">
          <SectionHeading
            eyebrow="Best sellers"
            title="Most loved pieces"
            action={<Link href={ALL_JEWELLERY} className="whitespace-nowrap text-[13px] text-forest-900 underline underline-offset-4">View all</Link>}
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-forest-900" /></div>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 md:grid-cols-4 md:gap-6">
            {bestSellers.map((product, i) => (
              // Phones show six; desktop shows one row of four.
              <div key={product.id} className={i >= 4 ? 'md:hidden' : ''}>
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        )}
        <Link
          href={ALL_JEWELLERY}
          className="mt-[18px] flex h-[46px] w-full items-center justify-center rounded-[10px] border border-forest-900 bg-white text-xs font-semibold uppercase tracking-[0.12em] text-forest-900 md:hidden"
        >
          Shop all jewellery
        </Link>
      </section>

      {/* Trust row (phones) */}
      <section className="order-5 px-4 pt-3.5 md:hidden">
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: ShieldCheck, label: ['925 certified', 'silver'] },
            { icon: Gift, label: ['Gift-ready', 'packaging'] },
            { icon: Truck, label: ['Delivery', 'across Nepal'] },
          ].map(item => (
            <div key={item.label[0]} className="flex flex-col items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-1.5 py-3 text-center text-[11px] leading-[1.3] text-stone-900">
              <item.icon className="h-5 w-5 text-forest-900" strokeWidth={1.5} />
              <span>{item.label[0]}<br />{item.label[1]}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Shop by budget */}
      {budgets.length > 0 && (
        <section className="order-6 mx-auto w-full max-w-[1280px] px-4 pt-11 md:order-4 md:px-10 md:pt-20">
          <SectionHeading eyebrow="Shop by budget" title="Find a piece in your range" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
            {budgets.map((budget, i) => {
              const { pre, amount } = splitBudgetLabel(budget.label);
              return (
                <Link
                  key={budget.slug}
                  href={`/collections?price=${budget.slug}`}
                  className={`flex flex-col gap-1 rounded-2xl px-4 py-[18px] transition-transform md:px-6 md:py-7 [@media(hover:hover)]:hover:-translate-y-0.5 ${BUDGET_TONES[i % BUDGET_TONES.length]}`}
                >
                  <span className="text-xs tracking-[0.08em]">{pre}</span>
                  <span className="font-serif text-[30px] leading-[1.05] md:text-[44px]">{amount}</span>
                  <span className="mt-2.5 text-xs">{budget.count} {budget.count === 1 ? 'piece' : 'pieces'} →</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Wedding & traditional (phones) */}
      <section className="order-7 px-4 pt-7 md:hidden">
        <div className="rounded-2xl bg-forest-900 px-5 py-[22px] text-white">
          <p className="text-[11px] uppercase tracking-[0.2em] text-forest-200">Wedding &amp; traditional</p>
          <h2 className="mt-2 font-serif text-2xl font-normal leading-[1.15]">Heritage pieces for the big day</h2>
          <p className="mt-2 text-sm leading-[1.55] text-[#d5e2d8]">
            Tilahari, mangalsutra, pote and pauju. Ask us on WhatsApp for designs and pricing.
          </p>
          <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none]">
            {WEDDING_CATEGORIES.map(category => (
              <Link
                key={category.id}
                href={`/collections/${category.id}`}
                className="flex h-9 flex-none items-center rounded-full border border-white/40 px-3.5 text-[13px]"
              >
                {category.label}
              </Link>
            ))}
          </div>
          <a
            href={`${WHATSAPP}?text=${encodeURIComponent("Hi, I'm looking for wedding jewellery.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex h-11 items-center justify-center rounded-full bg-white text-[11px] font-semibold uppercase tracking-[0.14em] text-forest-900"
          >
            Ask on WhatsApp
          </a>
        </div>
      </section>

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="order-8 mx-auto w-full max-w-[1280px] px-4 pt-11 md:order-6 md:px-10 md:pt-20">
          <SectionHeading eyebrow="Reviews" title="What customers say" />
          {/* Rail on phones, three columns on desktop */}
          <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[86%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:auto-cols-auto md:grid-flow-row md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
            {reviews.map(review => (
              <Link
                key={`${review.product.id}-${review.author}`}
                href={getProductHref(review.product.id)}
                className="grid snap-start grid-cols-[96px_minmax(0,1fr)] gap-4 rounded-[14px] border border-stone-200 bg-white p-3.5"
              >
                {/* The product that was reviewed, not a customer photo. */}
                <img src={review.product.image} alt={review.product.name} loading="lazy" className="h-[120px] w-24 rounded-[10px] object-cover" />
                <div className="flex min-w-0 flex-col">
                  <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className="h-[13px] w-[13px] text-[#b8941f]" strokeWidth={1.2} fill={n <= Math.round(review.rating) ? '#b8941f' : 'none'} />
                    ))}
                  </div>
                  {review.title && <p className="mt-2 text-sm font-medium text-stone-900">{review.title}</p>}
                  <p className="mt-1 text-[13px] leading-[1.55] text-stone-600 [text-wrap:pretty]">{review.text}</p>
                  <p className="mt-auto pt-2.5 text-[11px] uppercase tracking-[0.12em] text-stone-700">
                    {review.author} <span className="normal-case tracking-normal text-stone-500">· {review.product.name}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Help CTA */}
      <section className="order-9 mt-11 bg-forest-100 md:order-7 md:mt-20">
        <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-6 px-4 py-11 md:flex-row md:items-center md:px-10 md:py-20">
          <div>
            <h2 className="font-serif text-[26px] font-normal text-forest-900 md:text-[34px]">Need help choosing?</h2>
            <p className="mt-2.5 text-[15px] text-forest-600">
              Questions about sizing, gifting, or delivery? We reply on WhatsApp within minutes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={`${WHATSAPP}?text=${encodeURIComponent('Hi, I need help choosing jewelry.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center rounded-full bg-forest-900 px-6 text-[11px] font-medium uppercase tracking-[0.16em] text-white"
            >
              Chat on WhatsApp
            </a>
            <Link
              href="/about"
              className="flex h-12 items-center rounded-full border border-forest-900 px-6 text-[11px] font-medium uppercase tracking-[0.16em] text-forest-900"
            >
              Our story
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
