import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import ReviewSection from '@/components/jewelry/ReviewSection';
import SiteMeta from '@/components/SiteMeta';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Gift,
  Ruler,
  ShieldCheck,
  ShoppingBag,
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
import StoreRateStrip from '@/components/StoreRateStrip';
import { formatProductLabel, getExplicitBundleProducts, getSimilarProducts } from '@/lib/product-taxonomy';

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

const RING_SIZE_GUIDE = [
  { size: '6', mm: '16.5 mm', fit: 'Small / slim fingers' },
  { size: '7', mm: '17.3 mm', fit: 'Most common regular fit' },
  { size: '8', mm: '18.1 mm', fit: 'Comfortable medium-large' },
  { size: '9', mm: '19.0 mm', fit: 'Larger / statement wear' },
];

function RecommendationSection({
  title,
  products,
  onAddToCart,
}: {
  title: string;
  products: JewelryProduct[];
  onAddToCart: (p: JewelryProduct) => void;
}) {
  if (products.length === 0) return null;
  return (
    <section className="border-t border-stone-200 bg-white py-12">
      <div className="container">
        <h2 className="mb-8 font-serif text-2xl font-light text-stone-900">{title}</h2>
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {products.map(item => (
            <ProductCard key={item.id} product={item} onAddToCart={onAddToCart} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProductDetails() {
  const [, params] = useRoute('/products/:productId');
  const [, navigate] = useLocation();
  const productId = params?.productId || '';
  const [products, setProducts] = useState<JewelryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const { addItem, openCart } = useCartContext();
  const { toggleWishlist, isWishlisted, trackRecentlyViewed, recentlyViewed } = useEngagementContext();
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
    setActiveImage(0);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [productId]);

  useEffect(() => {
    if (product) trackRecentlyViewed(product);
  }, [product?.id]);

  const handleAddToCart = (item: JewelryProduct) => {
    if (!item.inStock) {
      toast({ title: 'Out of Stock', description: 'This piece is currently unavailable.', variant: 'destructive' });
      return;
    }
    addItem(item);
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
    addItem(product);
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-stone-900" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white pt-24">
        <div className="container max-w-2xl py-24 text-center">
          <h1 className="mb-4 text-3xl font-serif font-light text-stone-900">Product not found</h1>
          <p className="mb-8 text-stone-500">This item may have been removed or the link has changed.</p>
          <Link href="/" className="inline-flex items-center gap-2 border border-stone-300 px-6 py-3 text-xs uppercase tracking-[0.18em] text-stone-700 hover:border-stone-900 transition-colors">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
            Back to collection
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [product.image];
  const selectedImage = images[activeImage] || images[0];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  const reviews = product.reviews || [];
  const careTips = product.care?.length ? product.care : buildDefaultCare(product);
  const materialLabel = product.material === '925_silver' ? '925 Sterling Silver' : formatProductLabel(product.material);
  const isMarketLinked = product.priceSource === 'market_rate' && Boolean(product.metalRateKey);
  const livePriceNote = product.priceSource === 'market_rate' && product.priceUpdatedAt
    ? `Market-linked price using the ${product.metalRateLabel || materialLabel} rate updated ${formatShortDate(product.priceUpdatedAt)}.`
    : null;
  const wishlisted = isWishlisted(product.id);
  const reviewCount = product.reviewCount || reviews.length;
  const rating = product.rating || (reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : undefined);
  const designStory = product.designStory || product.description;
  const highlights = product.highlights?.length ? product.highlights : [];
  const stylingNote = product.styleNote || (
    product.occasions?.length
      ? `Works well for ${product.occasions.map(o => formatProductLabel(o).toLowerCase()).join(', ')}.`
      : product.occasion
        ? `Works well for ${formatProductLabel(product.occasion).toLowerCase()}.`
        : null
  );
  const purchaseInfo = [
    { label: 'Material', value: materialLabel, icon: ShieldCheck },
    { label: 'Dispatch', value: product.deliveryEstimate || '2-4 business days' },
    ...(product.giftWrapAvailable
      ? [{ label: 'Gift wrap', value: 'Available at checkout', icon: Gift }]
      : []),
    { label: 'Delivery', value: 'Across Nepal', icon: Truck },
  ];
  const specs = [
    { label: 'Category', value: formatProductLabel(product.category) },
    { label: 'Material', value: formatProductLabel(product.material) },
    { label: 'Metal Tone', value: product.metalTone && formatProductLabel(product.metalTone) },
    { label: 'Plating', value: product.plating },
    { label: 'Stone', value: product.stoneType },
    { label: 'Weight', value: product.weight },
    { label: 'Dimensions', value: product.dimensions },
    { label: 'Occasion', value: product.occasions?.join(', ') || product.occasion },
    { label: 'Style', value: product.styles?.map(formatProductLabel).join(', ') },
    { label: 'Collection', value: product.collection },
  ].filter(e => Boolean(e.value));

  const completeTheLook = getExplicitBundleProducts(products, product);
  const similarProducts = getSimilarProducts(products, product, 4);
  const recentProducts = recentlyViewed.filter(p => p.id !== product.id).slice(0, 4);

  const productImages = [product.image, ...(product.images || [])].filter(Boolean);
  const productJsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    image: productImages.map(img => img.startsWith('http') ? img : `https://www.aashish.website${img}`),
    description: product.description,
    sku: product.id,
    brand: { '@type': 'Brand', name: 'Aashish Jewellers' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NPR',
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://www.aashish.website/products/${encodeURIComponent(product.id)}`,
      seller: { '@type': 'Organization', name: 'Aashish Jewellers' },
    },
    ...(rating && { aggregateRating: { '@type': 'AggregateRating', ratingValue: rating, reviewCount: reviewCount || 1 } }),
  };

  return (
    <div className="bg-white">
      <SiteMeta
        title={product.name}
        description={product.description.slice(0, 155)}
        image={product.image}
        jsonLd={productJsonLd}
        canonical={`/products/${encodeURIComponent(product.id)}`}
      />

      {/* Breadcrumb */}
      <div className="border-b border-stone-100">
        <div className="container flex items-center gap-2 py-3 text-[11px] uppercase tracking-[0.14em] text-stone-400">
          <Link href="/" className="hover:text-stone-700 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/shop-by" className="hover:text-stone-700 transition-colors">Shop</Link>
          <span>/</span>
          <span className="text-stone-600">{formatProductLabel(product.category)}</span>
        </div>
      </div>

      {/* Main product section */}
      <section className="relative overflow-hidden">
        <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-[#efe4ca]/60 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-stone-200/60 blur-3xl" aria-hidden="true" />
        <div className="container py-6 md:py-12">
        <div className="grid items-start gap-6 md:gap-8 lg:grid-cols-[1fr_1fr] xl:grid-cols-[1.1fr_0.9fr] xl:gap-14">

          {/* Gallery */}
          <div className="xl:sticky xl:top-24">
            <div className="border border-stone-200 bg-[linear-gradient(135deg,#fbf8f3_0%,#ffffff_55%,#f4efe7_100%)] p-2.5 shadow-[0_24px_60px_rgba(28,25,23,0.08)] md:p-4">
            <div className="flex flex-col-reverse gap-3 md:flex-row md:items-start">
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2 md:grid-cols-1 md:w-16">
                  {images.map((img, i) => (
                    <button
                      key={`${img}-${i}`}
                      type="button"
                      onClick={() => setActiveImage(i)}
                      className={`aspect-square overflow-hidden border bg-white shadow-sm transition-colors ${
                        i === activeImage ? 'border-stone-900' : 'border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} view ${i + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main image */}
              <div className="flex-1 overflow-hidden bg-[#f0ebe3]">
                <img
                  src={selectedImage}
                  alt={product.name}
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
            </div>
            </div>
          </div>

          {/* Details */}
          <div className="xl:sticky xl:top-24">
            <div className="border border-stone-200 bg-[linear-gradient(135deg,#ffffff_0%,#faf8f5_48%,#f4efe7_100%)] p-5 shadow-[0_24px_60px_rgba(28,25,23,0.08)] md:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center border border-stone-300 bg-white/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-stone-700">
                {formatProductLabel(product.category)}
              </span>
              <span className="inline-flex items-center border border-stone-300 bg-white/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-stone-700">
                {materialLabel}
              </span>
              {isMarketLinked && (
                <span className="inline-flex items-center border border-stone-300 bg-white/80 px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-stone-700">
                  Market-linked price
                </span>
              )}
            </div>
            {/* Label + name */}
            <p className="mt-5 text-[10px] uppercase tracking-[0.22em] text-stone-400">
              {formatProductLabel(product.category)} / {materialLabel}
            </p>
            <h1 className="mt-2 font-serif text-3xl font-light leading-tight text-stone-900 md:text-4xl">
              {product.name}
            </h1>

            {/* Rating */}
            {rating && (
              <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-0.5 text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'fill-current' : ''}`} strokeWidth={1} />
                  ))}
                </div>
                <span className="text-xs text-stone-500">{rating.toFixed(1)}{reviewCount ? ` - ${reviewCount} reviews` : ''}</span>
              </div>
            )}

            {/* Price */}
            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-2xl font-light text-stone-900">NPR {product.price.toLocaleString()}</span>
              {hasDiscount && (
                <>
                  <span className="text-base text-stone-400 line-through">NPR {product.originalPrice!.toLocaleString()}</span>
                  <span className="text-xs uppercase tracking-[0.14em] text-emerald-700">{discountPercent}% off</span>
                </>
              )}
            </div>

            {livePriceNote && (
              <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-stone-400">
                {livePriceNote}
              </p>
            )}

            {isMarketLinked && product.metalRateKey && (
              <StoreRateStrip focusRateKey={product.metalRateKey} compact={true} />
            )}

            {/* Stock */}
            <p className={`mt-4 inline-flex border px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] ${
              product.inStock
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-600'
            }`}>
              {product.inStock ? 'In stock - ready to dispatch' : 'Currently out of stock'}
            </p>

            {/* Description */}
            <p className="mt-5 text-base font-light leading-relaxed text-stone-600">
              {product.description}
            </p>

            {/* Highlights */}
            {highlights.length > 0 && (
              <ul className="mt-4 space-y-1.5">
                {highlights.map(h => (
                  <li key={h} className="flex items-start gap-2 text-sm text-stone-600">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stone-400" />
                    {h}
                  </li>
                ))}
              </ul>
            )}

            {/* CTAs */}
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => handleAddToCart(product)}
                disabled={!product.inStock}
                className="flex-1 bg-stone-900 py-3.5 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <ShoppingBag className="h-4 w-4" strokeWidth={1.5} />
                  {product.inStock ? 'Add to bag' : 'Out of stock'}
                </span>
              </button>
              <button
                type="button"
                onClick={handleWishlist}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                className={`flex h-[46px] w-[46px] items-center justify-center border transition-colors ${
                  wishlisted ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-300 text-stone-700 hover:border-stone-900'
                }`}
              >
                <Heart className="h-4 w-4" strokeWidth={1.5} fill={wishlisted ? 'currentColor' : 'none'} />
              </button>
            </div>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!product.inStock}
              className="mt-2 w-full border border-stone-300 py-3.5 text-xs uppercase tracking-[0.2em] text-stone-800 transition-colors hover:border-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Buy now - go to checkout
            </button>

            {/* Key info */}
            <div className="hidden">
              <div className="flex justify-between py-3">
                <span className="text-stone-400">Material</span>
                <span className="flex items-center gap-1.5 text-stone-700">
                  <ShieldCheck className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                  {materialLabel}
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-stone-400">Dispatch</span>
                <span className="text-stone-700">{product.deliveryEstimate || '2-4 business days'}</span>
              </div>
              {product.giftWrapAvailable && (
                <div className="flex justify-between py-3">
                  <span className="text-stone-400">Gift wrap</span>
                  <span className="flex items-center gap-1.5 text-stone-700">
                    <Gift className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                    Available at checkout
                  </span>
                </div>
              )}
              <div className="flex justify-between py-3">
                <span className="text-stone-400">Delivery</span>
                <span className="flex items-center gap-1.5 text-stone-700">
                  <Truck className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />
                  Across Nepal
                </span>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {purchaseInfo.map(item => (
                <div key={item.label} className="border border-stone-200 bg-white/75 px-4 py-4 text-sm text-stone-600">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">{item.label}</p>
                  <p className="mt-3 flex items-center gap-2 text-stone-800">
                    {item.icon && <item.icon className="h-3.5 w-3.5 text-stone-400" strokeWidth={1.5} />}
                    <span>{item.value}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* Helper links */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-stone-500">
              {product.category === 'rings' && (
                <Link href="/size-guide" className="flex items-center gap-1.5 underline underline-offset-4 hover:text-stone-900 transition-colors">
                  <Ruler className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Ring size guide
                </Link>
              )}
              <a
                href={`https://wa.me/9779811469486?text=${encodeURIComponent(`Hi, I want to know more about ${product.name} (${product.id}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 underline underline-offset-4 hover:text-stone-900 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                Ask on WhatsApp
              </a>
            </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      {/* Product details */}
      <section className="border-t border-stone-200 bg-[#faf8f5] py-12 md:py-14">
        <div className="container">
          <div className="grid gap-10 lg:grid-cols-2 xl:gap-16">

            {/* Left: design story + highlights + styling */}
            <div className="space-y-8">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-3">About this piece</p>
                <p className="text-base font-light leading-relaxed text-stone-700">{designStory}</p>
                {stylingNote && (
                  <p className="mt-3 text-sm text-stone-500">{stylingNote}</p>
                )}
                {product.recipients?.length ? (
                  <p className="mt-2 text-sm text-stone-500">
                    A thoughtful gift for {product.recipients.map(r => formatProductLabel(r).toLowerCase()).join(', ')}.
                  </p>
                ) : null}
              </div>

              {/* Care */}
              <div className="border-t border-stone-200 pt-8">
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-4">Care guide</p>
                <ul className="space-y-2.5">
                  {careTips.map(tip => (
                    <li key={tip} className="flex items-start gap-2.5 text-sm text-stone-600">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" strokeWidth={1.5} />
                      {tip}
                    </li>
                  ))}
                </ul>
                <Link href="/care-guide" className="mt-4 inline-flex text-xs uppercase tracking-[0.14em] text-stone-500 underline underline-offset-4 hover:text-stone-900 transition-colors">
                  Full care guide {'->'}
                </Link>
              </div>
            </div>

            {/* Right: specs + ring size */}
            <div className="space-y-8">
              {specs.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-4">Specifications</p>
                  <dl className="divide-y divide-stone-200">
                    {specs.map(spec => (
                      <div key={spec.label} className="flex justify-between gap-4 py-3 text-sm">
                        <dt className="text-stone-400">{spec.label}</dt>
                        <dd className="text-right text-stone-700">{spec.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {product.category === 'rings' && (
                <div className="border-t border-stone-200 pt-8">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-4">Ring sizes</p>
                  <div className="divide-y divide-stone-200">
                    {RING_SIZE_GUIDE.map(row => (
                      <div key={row.size} className="flex items-baseline gap-4 py-3 text-sm">
                        <span className="w-12 font-medium text-stone-800">Size {row.size}</span>
                        <span className="w-20 text-stone-500">{row.mm}</span>
                        <span className="text-stone-500">{row.fit}</span>
                      </div>
                    ))}
                  </div>
                  {product.fitNotes && <p className="mt-3 text-sm text-stone-500">{product.fitNotes}</p>}
                  <Link href="/size-guide" className="mt-3 inline-flex text-xs uppercase tracking-[0.14em] text-stone-500 underline underline-offset-4 hover:text-stone-900 transition-colors">
                    Full size guide {'->'}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="border-t border-stone-200 bg-white py-12 md:py-14">
        <div className="container">
          <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2">Reviews</p>
          <h2 className="font-serif text-2xl font-light text-stone-900 mb-8">
            {reviewCount > 0 ? `${reviewCount} customer ${reviewCount === 1 ? 'review' : 'reviews'}` : 'Customer reviews'}
          </h2>

          {reviews.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
              {reviews.map((review, i) => (
                <div key={`${review.author}-${i}`} className="border border-stone-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-stone-800">{review.author}</p>
                    <div className="flex items-center gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star key={si} className={`h-3.5 w-3.5 ${si < Math.round(review.rating) ? 'fill-current' : ''}`} strokeWidth={1} />
                      ))}
                    </div>
                  </div>
                  <p className="mt-0.5 text-xs text-stone-400">{review.verified ? 'Verified purchase' : 'Customer review'}</p>
                  {review.title && <p className="mt-3 text-sm font-medium text-stone-800">{review.title}</p>}
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{review.text}</p>
                </div>
              ))}
            </div>
          ) : null}

          <ReviewSection productId={product.id} />
        </div>
      </section>

      <RecommendationSection title="Complete the look" products={completeTheLook} onAddToCart={handleAddToCart} />
      <RecommendationSection title="You may also like" products={similarProducts} onAddToCart={handleAddToCart} />
      <RecommendationSection title="Recently viewed" products={recentProducts} onAddToCart={handleAddToCart} />
    </div>
  );
}
