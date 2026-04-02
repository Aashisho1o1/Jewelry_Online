import { Heart, Star, Zap } from 'lucide-react';
import { Link } from 'wouter';
import { JewelryProduct } from '../../types/jewelry';
import { useEngagementContext } from '@/contexts/EngagementContext';
import { getProductHref } from '@/lib/product-taxonomy';
import { useToast } from '@/hooks/use-toast';
import { useFlashSale } from '@/contexts/FlashSaleContext';

interface ProductCardProps {
  product: JewelryProduct;
  onAddToCart?: (product: JewelryProduct) => void;
}

function toDisplayLabel(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const { toggleWishlist, isWishlisted } = useEngagementContext();
  const { toast } = useToast();
  const { sale } = useFlashSale();

  const galleryImages = [product.image, ...(product.images || [])].filter(Boolean);
  const primaryImage = galleryImages[0] || '/images/jewelry/placeholder.svg';
  const secondaryImage = galleryImages.find(img => img !== primaryImage);
  const productHref = getProductHref(product.id);
  const wishlisted = isWishlisted(product.id);

  // Flash sale takes priority over regular discount
  const flashActive = sale !== null && new Date(sale.ends_at).getTime() > Date.now();
  const flashPrice = flashActive ? Math.round(product.price * (1 - sale!.discount_percent / 100)) : null;
  const flashPercent = flashActive ? Math.round(sale!.discount_percent) : 0;

  const hasDiscount = !flashActive && product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast({
      title: wishlisted ? 'Removed from wishlist' : 'Saved to wishlist',
      description: product.name,
    });
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  return (
    <div className="group">
      {/* Image block */}
      <div className="relative overflow-hidden bg-[#f0ebe3]">
        <Link href={productHref} className="block">
          <img
            src={primaryImage}
            alt={product.name}
            className={`aspect-[4/5] w-full object-cover transition-all duration-700 ${
              secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-105'
            }`}
            loading="lazy"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          {secondaryImage && (
            <img
              src={secondaryImage}
              alt={`${product.name} - alternate view`}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 group-hover:scale-105 group-hover:opacity-100"
              loading="lazy"
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </Link>

        {/* Desktop hover: Add to bag slide-up */}
        {onAddToCart && (
          <div className="absolute inset-x-0 bottom-0 hidden translate-y-full transition-transform duration-300 group-hover:translate-y-0 md:block">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="w-full bg-stone-900 py-3 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-stone-700 disabled:bg-stone-400 disabled:cursor-not-allowed"
            >
              {product.inStock ? 'Add to bag' : 'Out of stock'}
            </button>
          </div>
        )}

        {/* Badges */}
        {(product.isNew || hasDiscount || flashActive) && (
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNew && (
              <span className="bg-stone-900 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-white">
                New
              </span>
            )}
            {flashActive && (
              <span className="inline-flex items-center gap-1 bg-amber-500 px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-white">
                <Zap className="h-2 w-2" strokeWidth={2.5} />
                -{flashPercent}%
              </span>
            )}
            {!flashActive && hasDiscount && (
              <span className="bg-white px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] text-stone-900">
                -{discountPercent}%
              </span>
            )}
          </div>
        )}

        {/* Wishlist - always visible on mobile, hover-reveal on desktop */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute right-3 top-3 flex h-10 w-10 items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-200 hover:bg-white md:h-8 md:w-8 ${
            wishlisted ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
          }`}
        >
          <Heart
            className="h-[15px] w-[15px]"
            strokeWidth={1.5}
            fill={wishlisted ? '#1c1917' : 'none'}
            color="#1c1917"
          />
        </button>
      </div>

      {/* Info */}
      <div className="pt-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-stone-400">
          {toDisplayLabel(product.category || 'jewelry')}
        </p>

        <Link href={productHref}>
          <h3 className="mt-1 font-serif text-[15px] font-light leading-snug text-stone-900 transition-colors hover:text-stone-500">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-sm text-stone-800">
            NPR {(flashPrice ?? product.price).toLocaleString()}
          </span>
          {flashActive && (
            <span className="text-xs text-stone-400 line-through">
              NPR {product.price.toLocaleString()}
            </span>
          )}
          {!flashActive && hasDiscount && (
            <span className="text-xs text-stone-400 line-through">
              NPR {product.originalPrice!.toLocaleString()}
            </span>
          )}
          {product.rating && (
            <span className="ml-auto flex items-center gap-0.5 text-[11px] text-stone-400">
              <Star className="h-2.5 w-2.5 fill-current" strokeWidth={1} />
              {product.rating.toFixed(1)}
            </span>
          )}
        </div>

        {product.priceSource === 'market_rate' && (
          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-stone-400">
            Market-linked price
          </p>
        )}

        {/* Mobile: always-visible add button */}
        {onAddToCart && (
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="mt-3 w-full border border-stone-200 py-2.5 text-[10px] uppercase tracking-[0.18em] text-stone-600 transition-colors active:border-stone-900 active:bg-stone-900 active:text-white disabled:opacity-40 md:hidden"
          >
            {product.inStock ? 'Add to bag' : 'Out of stock'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
