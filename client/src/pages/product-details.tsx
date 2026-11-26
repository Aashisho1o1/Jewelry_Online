import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import ReviewSection from '@/components/jewelry/ReviewSection';
import SiteMeta, { SITE_URL } from '@/components/SiteMeta';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Gift,
  Heart,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react';
import { JewelryProduct } from '@/types/jewelry';
import { getProducts } from '@/data/product-loader';
import { useCartContext } from '@/contexts/CartContext';
import { useEngagementContext } from '@/contexts/EngagementContext';
import { useToast } from '@/hooks/use-toast';
import ProductCard from '@/components/jewelry/ProductCard';
import ProductGallery from '@/components/jewelry/ProductGallery';
import { formatProductLabel, getExplicitBundleProducts, getSimilarProducts } from '@/lib/product-taxonomy';
import { RING_SIZE_UNSURE, SIZE_CHOICES, sizeChoicesFor } from '@/lib/ring-sizes';
import { cn } from '@/lib/utils';
import { weightLabel } from '@/lib/weight';

function buildDefaultCare(product: JewelryProduct) {
  const base = [
    'Store in a soft pouch or lined box after each use.',
    'Keep away from perfume, lotion, sanitizer and harsh cleaners.',
    'Wipe gently with a soft dry cloth after wearing.',
  ];
  if (product.material === '925_silver') {
    base.push('Use a silver polishing cloth occasionally to reduce tarnish.');
  }
  if (product.plating) {
    base.push('Avoid rubbing plated surfaces aggressively to protect the finish.');
  }
  return base;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ProductRail({ title, products, onAddToCart }: { title: string; products: JewelryProduct[]; onAddToCart: (p: JewelryProduct) => void }) {
  if (products.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-11 md:px-10 md:pt-20">
      <h2 className="mb-5 font-serif text-[26px] font-normal text-stone-900 md:text-[34px]">{title}</h2>
      {/* Rail on phones, four columns on desktop */}
      <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[46%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid-flow-row md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0">
        {products.map(item => (
          <div key={item.id} className="snap-start">
            <ProductCard product={item} onAddToCart={onAddToCart} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-200">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex h-[54px] w-full items-center justify-between text-left text-sm font-medium text-stone-900"
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 transition-transform duration-200', open && 'rotate-180')} strokeWidth={1.5} />
      </button>
      {open && <div className="flex flex-col gap-1.5 pb-4 text-sm leading-relaxed text-stone-600">{children}</div>}
    </div>
  );
}

export default function ProductDetails() {
  const [, params] = useRoute('/products/:productId');
  const [, navigate] = useLocation();
  const productId = params?.productId || '';
  const [products, setProducts] = useState<JewelryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const sizePickerRef = useRef<HTMLDivElement>(null);
  const { addItem, openCart, gift, setGift } = useCartContext();
  const { toggleWishlist, isWishlisted, trackRecentlyViewed } = useEngagementContext();
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    getProducts()
      .then(r => { if (!cancelled) setProducts(r); })
      .catch(e => console.error('Failed to load products:', e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const product = useMemo(
    () => products.find(p => p.id.toLowerCase() === productId.toLowerCase()),
    [products, productId]
  );

  useEffect(() => {
    setSize(null);
    setSizeError(false);
    setShowMore(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [productId]);

  useEffect(() => {
    if (product) trackRecentlyViewed(product);
  }, [product?.id]);

  // Pieces with sizes can't go in the bag without one; send the customer to the picker instead.
  const requireSize = () => {
    if (!product || !sizeChoicesFor(product) || size) return true;
    setSizeError(true);
    sizePickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast({ title: `Choose a ${sizeChoicesFor(product)!.title.toLowerCase()}`, description: 'Pick your size, or "Not sure" and we\'ll confirm it by phone.' });
    return false;
  };

  const handleAddToCart = (item: JewelryProduct) => {
    if (!item.inStock) {
      toast({ title: 'Out of Stock', description: 'This piece is currently unavailable.', variant: 'destructive' });
      return;
    }
    if (item.id === product?.id && !requireSize()) return;
    addItem(item, item.id === product?.id ? size || undefined : undefined);
    toast({ title: 'Added to bag', description: item.name });
    setTimeout(() => openCart(), 400);
  };

  const handleWishlist = () => {
    if (!product) return;
    const wishlisted = isWishlisted(product.id);
    toggleWishlist(product);
    toast({ title: wishlisted ? 'Removed from wishlist' : 'Saved to wishlist', description: product.name });
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (!product.inStock) {
      toast({ title: 'Out of Stock', description: 'This piece is currently unavailable.', variant: 'destructive' });
      return;
    }
    if (!requireSize()) return;
    addItem(product, size || undefined);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-forest-900" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="container max-w-2xl py-24 text-center">
          <h1 className="mb-4 font-serif text-3xl font-normal text-stone-900">Product not found</h1>
          <p className="mb-8 text-stone-500">This item may have been removed or the link has changed.</p>
          <Link href="/collections" className="inline-flex items-center gap-2 rounded-full border border-forest-900 px-6 py-3 text-xs uppercase tracking-[0.16em] text-forest-900">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to the shop
          </Link>
        </div>
      </div>
    );
  }

  const gallery = Array.from(new Set([product.image, ...(product.images || [])].filter(Boolean)));
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercent = product.flashSalePercent || (hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0);
  const reviews = product.reviews || [];
  const careTips = product.care?.length ? product.care : buildDefaultCare(product);
  const isSilver = product.material === '925_silver';
  const materialLabel = isSilver ? '925 Sterling Silver' : formatProductLabel(product.material);
  const livePriceNote = product.priceSource === 'market_rate' && product.priceUpdatedAt
    ? `Market-linked price using the ${product.metalRateLabel || materialLabel} rate updated ${formatShortDate(product.priceUpdatedAt)}.`
    : null;
  const wishlisted = isWishlisted(product.id);
  const reviewCount = product.reviewCount || reviews.length;
  const rating = product.rating || (reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : undefined);
  const sizeChoice = sizeChoicesFor(product);
  const isRing = sizeChoice === SIZE_CHOICES.rings;
  // Stored estimates may already read 'Dispatch in ...'; keep just the time so sentences read correctly.
  const dispatch = (product.deliveryEstimate || '2 to 4 business days').replace(/^dispatch(es)? in\s*/i, '');
  const giftAvailable = product.giftWrapAvailable !== false;

  const bullets = [
    ...(product.highlights || []),
    materialLabel,
    product.stoneType && `Stone: ${product.stoneType}`,
    product.weight && `Weight: ${weightLabel(product.weight)}`,
    product.dimensions && `Size: ${product.dimensions}`,
    giftAvailable && 'Comes in gift-ready Aashish packaging',
    'Net quantity: 1 piece',
  ].filter(Boolean) as string[];
  const designStory = product.designStory && product.designStory !== product.description ? product.designStory : null;
  const hasMore = bullets.length > 3 || Boolean(designStory || product.styleNote || product.recipients?.length);

  // Only show a review photo when it's a real customer photo, not one of the product shots.
  const realReviewPhoto = (photo?: string) => (photo && !gallery.includes(photo) ? photo : null);

  const completeTheLook = getExplicitBundleProducts(products, product);
  const similarProducts = getSimilarProducts(products, product, 4);

  const productJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: gallery.map(img => img.startsWith('http') ? img : `${SITE_URL}${img}`),
    description: product.description,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'Aashish Jewellers' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NPR',
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${SITE_URL}/products/${encodeURIComponent(product.id)}`,
      seller: { '@type': 'Organization', name: 'Aashish Jewellers' },
    },
    ...(rating && { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating, reviewCount: reviewCount || 1 } }),
  };

  const assurances = [
    { icon: RotateCcw, label: ['30-day', 'returns'] },
    { icon: Sparkles, label: ['After-care', 'support'] },
    // Only silver pieces carry the 925 claim; gold and plated pieces get the general quality promise.
    { icon: ShieldCheck, label: isSilver ? ['925 certified', 'silver'] : ['Quality', 'checked'] },
    { icon: Truck, label: ['Delivery', 'across Nepal'] },
  ];

  return (
    <div className="bg-cream">
      <SiteMeta
        title={product.name}
        description={product.description.slice(0, 155)}
        image={product.image}
        jsonLd={productJsonLd}
        canonical={`/products/${encodeURIComponent(product.id)}`}
      />

      <section className="mx-auto max-w-[1280px] px-4 pt-4 md:px-10 md:pt-7">
        <nav aria-label="Breadcrumb" className="mb-4 truncate text-xs text-stone-500">
          <Link href="/" className="py-2 hover:text-forest-900">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href={`/collections/${product.category}`} className="py-2 hover:text-forest-900">{formatProductLabel(product.category)}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-stone-700">{product.name}</span>
        </nav>

        <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-14">
          <ProductGallery
            images={gallery}
            name={product.name}
            rating={rating}
            reviewCount={reviewCount}
            similarHref={`/collections/${product.category}`}
          />

          <div className="flex flex-col gap-5 md:sticky md:top-24">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2.5">
                <span className="text-[26px] font-semibold text-stone-900">NPR {product.price.toLocaleString()}</span>
                {hasDiscount && <span className="text-[15px] text-stone-500 line-through">NPR {product.originalPrice!.toLocaleString()}</span>}
                {discountPercent > 0 && <span className="text-[15px] font-semibold text-forest-700">{discountPercent}% off</span>}
              </div>
              {livePriceNote && <p className="mt-1.5 text-xs text-stone-600">{livePriceNote}</p>}
              <h1 className="mt-3.5 font-serif text-[22px] font-normal leading-[1.2] text-stone-900 md:text-[28px]">{product.name}</h1>
              <p className="mt-1.5 text-[13px] text-stone-600">{isSilver ? 'Made with 925 sterling silver' : materialLabel}</p>
              {!product.inStock && <p className="mt-2 text-sm font-medium text-red-700">Currently out of stock</p>}
            </div>

            {sizeChoice && (
              <div ref={sizePickerRef}>
                <div className="mb-2.5 flex justify-between text-xs">
                  <span id="ring-size-label" className="uppercase tracking-[0.16em] text-stone-600">{sizeChoice.title}</span>
                  <Link href="/size-guide" className="text-forest-900 underline underline-offset-[3px]">Size guide</Link>
                </div>
                <div role="radiogroup" aria-labelledby="ring-size-label" className="flex flex-wrap gap-2">
                  {[...sizeChoice.options, { value: RING_SIZE_UNSURE, label: 'Not sure' }].map(option => {
                    const on = size === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => { setSize(option.value); setSizeError(false); }}
                        className={cn(
                          'h-11 min-w-12 rounded-lg border px-3 text-sm transition-colors',
                          on ? 'border-forest-900 bg-forest-900 text-white' : 'border-stone-300 bg-white text-stone-900 hover:border-forest-900'
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {size === RING_SIZE_UNSURE && <p className="mt-2 text-xs text-stone-600">No problem. We&apos;ll confirm your size when we call to confirm the order.</p>}
                {sizeError && <p role="alert" className="mt-2 text-xs font-medium text-red-700">Please choose a {sizeChoice.title.toLowerCase()}.</p>}
              </div>
            )}

            {giftAvailable && (
              <button
                type="button"
                role="checkbox"
                aria-checked={gift}
                onClick={() => setGift(!gift)}
                className="flex items-center gap-3 rounded-xl border border-dashed border-[#b8941f] bg-cream-gift px-4 py-3.5 text-left"
              >
                <Gift className="h-[22px] w-[22px] flex-none text-[#8b6b1f]" strokeWidth={1.5} />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-sm font-medium text-stone-900">Make it special</span>
                  <span className="text-xs text-stone-600">Gift-ready packaging with a handwritten note</span>
                </span>
                <span className={cn('flex h-5 w-5 flex-none items-center justify-center rounded border', gift ? 'border-forest-900 bg-forest-900 text-white' : 'border-stone-400 bg-white')}>
                  {gift && <Check className="h-3 w-3" strokeWidth={3} />}
                </span>
              </button>
            )}

            <div className="grid grid-cols-[1fr_1fr_52px] gap-2.5">
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="h-[52px] rounded-[10px] border border-forest-900 bg-white text-xs font-semibold uppercase tracking-[0.14em] text-forest-900 hover:bg-forest-50 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400"
              >
                Buy now
              </button>
              <button
                type="button"
                onClick={() => handleAddToCart(product)}
                disabled={!product.inStock}
                className="h-[52px] rounded-[10px] bg-forest-900 text-xs font-semibold uppercase tracking-[0.14em] text-white hover:bg-forest-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                {product.inStock ? 'Add to bag' : 'Sold out'}
              </button>
              <button
                type="button"
                onClick={handleWishlist}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                aria-pressed={wishlisted}
                className="flex h-[52px] items-center justify-center rounded-[10px] border border-stone-300 bg-white text-forest-900"
              >
                <Heart className="h-[19px] w-[19px]" strokeWidth={1.5} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <div className="rounded-[14px] border border-stone-200 bg-white px-4 py-[18px]">
              <p className="mb-4 font-serif text-lg text-stone-900">Aashish assures you</p>
              <div className="grid grid-cols-4 gap-2">
                {assurances.map(item => (
                  <div key={item.label[0]} className="flex flex-col items-center gap-2 text-center">
                    <span className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-forest-100">
                      <item.icon className="h-[22px] w-[22px] text-forest-900" strokeWidth={1.5} />
                    </span>
                    <span className="text-xs leading-[1.35] text-stone-900">{item.label[0]}<br />{item.label[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-[13px] text-forest-600">
              <p className="flex items-center gap-2"><Truck className="h-4 w-4 flex-none" strokeWidth={1.5} />Dispatch in {dispatch} · Free delivery all over Nepal</p>
              <a
                href={`https://wa.me/9779811469486?text=${encodeURIComponent(`Hi, I want to know more about ${product.name} (${product.id}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 py-1 text-forest-900 underline underline-offset-4"
              >
                <MessageCircle className="h-4 w-4 flex-none" strokeWidth={1.5} />
                Ask about this piece on WhatsApp
              </a>
            </div>

            <div className="border-t border-stone-200 pt-5">
              <h2 className="mb-2.5 font-serif text-xl font-normal text-stone-900">Product description</h2>
              <p className="text-sm leading-[1.7] text-stone-700 [text-wrap:pretty]">{product.description}</p>
              {showMore && designStory && (
                <p className="mt-3 text-sm leading-[1.7] text-stone-700"><strong className="font-semibold text-stone-900">The design:</strong> {designStory}</p>
              )}
              <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-[18px] text-sm leading-normal text-stone-700">
                {(showMore ? bullets : bullets.slice(0, 3)).map(b => <li key={b}>{b}</li>)}
              </ul>
              {showMore && product.styleNote && (
                <p className="mt-3 text-sm leading-[1.7] text-stone-700"><strong className="font-semibold text-stone-900">Styling tip:</strong> {product.styleNote}</p>
              )}
              {showMore && product.recipients?.length ? (
                <p className="mt-3 text-sm text-stone-700"><strong className="font-semibold text-stone-900">Gift idea for:</strong> {product.recipients.map(r => formatProductLabel(r)).join(' · ')}</p>
              ) : null}
              {hasMore && (
                <button type="button" onClick={() => setShowMore(m => !m)} className="mt-3 py-1 text-[13px] font-medium text-forest-900 underline underline-offset-4">
                  {showMore ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            <div className="border-t border-stone-200">
              <Accordion title="Care">
                {careTips.map(tip => <p key={tip}>{tip}</p>)}
                <Link href="/care-guide" className="mt-1 text-forest-900 underline underline-offset-4">Full care guide</Link>
              </Accordion>
              <Accordion title="Delivery & returns">
                <p>Dispatch in {dispatch}.</p>
                <p>Free delivery all over Nepal.</p>
                <p>30-day returns. <Link href="/returns" className="text-forest-900 underline underline-offset-4">Read the returns policy</Link></p>
              </Accordion>
              {sizeChoice && (
                <Accordion title={`${sizeChoice.title} guide`}>
                  {sizeChoice.options.map(r => <p key={r.value}><span className="font-medium text-stone-900">{r.label}</span> · {r.note}</p>)}
                  {product.fitNotes && <p className="mt-1">{product.fitNotes}</p>}
                </Accordion>
              )}
            </div>
          </div>
        </div>
      </section>

      {reviews.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-4 pt-11 md:px-10 md:pt-20">
          <h2 className="mb-5 font-serif text-[26px] font-normal text-stone-900 md:text-[34px]">Customer reviews</h2>
          <div className="-mx-4 grid snap-x snap-mandatory auto-cols-[86%] grid-flow-col gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:mx-0 md:auto-cols-auto md:grid-flow-row md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0">
            {reviews.map((review, i) => {
              const photo = realReviewPhoto(review.image);
              return (
                <div key={`${review.author}-${i}`} className={cn('grid snap-start gap-4 rounded-[14px] border border-stone-200 bg-white p-3.5', photo && 'grid-cols-[96px_minmax(0,1fr)]')}>
                  {photo && <img src={photo} alt={`Photo from ${review.author}`} loading="lazy" className="h-[120px] w-24 rounded-[10px] object-cover" />}
                  <div className="flex min-w-0 flex-col">
                    <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <Star key={n} className="h-[13px] w-[13px] text-[#b8941f]" strokeWidth={1.2} fill={n <= Math.round(review.rating) ? '#b8941f' : 'none'} />
                      ))}
                    </div>
                    {review.title && <p className="mt-2 text-sm font-medium text-stone-900">{review.title}</p>}
                    <p className="mt-1 text-[13px] leading-[1.55] text-stone-600">{review.text}</p>
                    <p className="mt-auto pt-2.5 text-[11px] uppercase tracking-[0.12em] text-stone-700">
                      {review.author} <span className="normal-case tracking-normal text-stone-500">· {review.verified ? 'Verified buyer' : 'Customer review'}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <ReviewSection productId={product.id} hasOtherReviews={reviews.length > 0} />
      </div>

      <ProductRail title="Complete the look" products={completeTheLook} onAddToCart={handleAddToCart} />
      <ProductRail title="You may also like" products={similarProducts} onAddToCart={handleAddToCart} />
      <div className="h-11 md:h-20" />

      {/* Phone buy bar: sticky (not fixed) so it stops above the footer instead of covering it */}
      <div className="sticky bottom-0 z-[15] grid grid-cols-[auto_1fr_1fr] items-center gap-2 border-t border-stone-200 bg-white px-4 pb-[calc(10px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-6px_20px_rgba(0,0,0,0.05)] md:hidden">
        <div className="flex flex-col pr-1">
          <span className="whitespace-nowrap text-base font-semibold text-stone-900">NPR {product.price.toLocaleString()}</span>
          {discountPercent > 0 && <span className="text-[11px] font-semibold text-forest-700">{discountPercent}% off</span>}
        </div>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!product.inStock}
          className="h-12 rounded-[10px] border border-forest-900 bg-white text-[11px] font-semibold uppercase tracking-[0.12em] text-forest-900 disabled:border-stone-300 disabled:text-stone-400"
        >
          Buy now
        </button>
        <button
          type="button"
          onClick={() => handleAddToCart(product)}
          disabled={!product.inStock}
          className="h-12 rounded-[10px] bg-forest-900 text-[11px] font-semibold uppercase tracking-[0.12em] text-white disabled:bg-stone-300"
        >
          {product.inStock ? 'Add to bag' : 'Sold out'}
        </button>
      </div>
    </div>
  );
}
