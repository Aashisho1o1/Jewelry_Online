import { Heart, Star } from 'lucide-react';
import { Link } from 'wouter';
import { JewelryProduct } from '../../types/jewelry';
import { useEngagementContext } from '@/contexts/EngagementContext';
import { getProductHref } from '@/lib/product-taxonomy';
import { useToast } from '@/hooks/use-toast';
import { needsRingSize } from '@/lib/ring-sizes';

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

  const image = product.image || product.images?.[0] || '/images/jewelry/placeholder.svg';
  const productHref = getProductHref(product.id);
  const wishlisted = isWishlisted(product.id);

  // The server already discounts price during a flash sale, so checkout charges what the card shows.
  const flashPercent = product.flashSalePercent ?? 0;
  const hasDiscount = Boolean(product.originalPrice && product.originalPrice > product.price);
  const discountPercent = flashPercent || (hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0);

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
    <div className="group flex h-full min-w-0 flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-cream-card">
        <Link href={productHref} className="block h-full" aria-label={product.name}>
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            // Hover zoom only on devices with a real pointer; on touch it would stick after a tap.
            className="h-full w-full object-cover transition-transform duration-[600ms] ease-out [@media(hover:hover)]:group-hover:scale-[1.04]"
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        </Link>

        {(discountPercent > 0 || product.isNew) && (
          <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
            {discountPercent > 0 && (
              <span className="rounded-full bg-forest-900 px-[9px] py-1 text-[10px] font-medium tracking-[0.06em] text-white">
                -{discountPercent}%
              </span>
            )}
            {product.isNew && (
              <span className="rounded-full bg-white/95 px-[9px] py-1 text-[10px] font-medium tracking-[0.06em] text-forest-900">
                New
              </span>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={wishlisted}
          className="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.92] text-forest-900"
        >
          <Heart className="h-4 w-4" strokeWidth={1.6} fill={wishlisted ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1 pt-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-[10px] uppercase tracking-[0.18em] text-stone-500">
            {toDisplayLabel(product.category || 'jewelry')}
          </span>
          {product.rating ? (
            <span className="flex shrink-0 items-center gap-[3px] text-[11px] text-stone-600">
              <Star className="h-[11px] w-[11px] fill-[#b8941f] text-[#b8941f]" strokeWidth={1} />
              {product.rating.toFixed(1)}
            </span>
          ) : null}
        </div>

        <Link href={productHref} className="font-serif text-[15px] leading-[1.35] text-stone-900 [text-wrap:pretty]">
          {product.name}
        </Link>

        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="whitespace-nowrap text-sm font-medium text-stone-900">NPR {product.price.toLocaleString()}</span>
          {hasDiscount && (
            <span className="whitespace-nowrap text-xs text-stone-500 line-through">NPR {product.originalPrice!.toLocaleString()}</span>
          )}
        </div>

        {product.priceSource === 'market_rate' && (
          <p className="text-[10px] uppercase tracking-[0.14em] text-stone-500">Market-linked price</p>
        )}

        {onAddToCart && needsRingSize(product.category) && product.inStock ? (
          // Rings need a size, which is picked on the product page.
          <div className="mt-auto pt-2.5">
            <Link
              href={productHref}
              className="flex h-10 w-full items-center justify-center rounded-full border border-forest-900 text-[11px] font-medium uppercase tracking-[0.16em] text-forest-900 transition-colors hover:bg-forest-900 hover:text-white"
            >
              Choose size
            </Link>
          </div>
        ) : onAddToCart && (
          // mt-auto pins the button to the bottom so buttons line up across a row.
          <div className="mt-auto pt-2.5">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className="h-10 w-full rounded-full border border-forest-900 text-[11px] font-medium uppercase tracking-[0.16em] text-forest-900 transition-colors hover:bg-forest-900 hover:text-white active:bg-forest-900 active:text-white disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400 disabled:hover:bg-transparent"
            >
              {product.inStock ? 'Add to bag' : 'Out of stock'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
