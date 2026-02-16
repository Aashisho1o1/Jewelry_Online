import React, { useState } from 'react';
import { Heart, Eye } from 'lucide-react';
import { JewelryProduct } from '../../types/jewelry';
import ImageLightbox from '../ui/image-lightbox';

interface ProductCardProps {
  product: JewelryProduct;
  onAddToCart?: (product: JewelryProduct) => void;
  onWishlist?: (product: JewelryProduct) => void;
}

function toDisplayLabel(value: string) {
  return value
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onWishlist,
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const primaryImage = product.image || product.images?.[0] || '/images/jewelry/placeholder.svg';
  
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <div className="group relative">
      {/* Product Image - Photo First Design */}
      <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden cursor-pointer" onClick={() => setIsLightboxOpen(true)}>
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            // Elegant fallback for missing images
            e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23fafafa"/><text x="150" y="200" text-anchor="middle" dy=".3em" fill="%23e5e5e5" font-size="14" font-family="serif">Image Coming Soon</text></svg>';
          }}
        />
        
        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Minimal Badges */}
        {(product.isNew || hasDiscount) && (
          <div className="absolute top-4 left-4">
            {product.isNew && (
              <span className="inline-block bg-black text-white text-xs tracking-[0.1em] px-3 py-1 mb-2">
                NEW ARRIVAL
              </span>
            )}
            {hasDiscount && (
              <span className="block bg-white/90 text-black text-xs tracking-[0.1em] px-3 py-1">
                {discountPercent}% OFF
              </span>
            )}
          </div>
        )}

        {/* Action Buttons - Appear on Hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToCart?.(product);
              }}
              disabled={!product.inStock}
              className="flex-1 bg-white text-black py-3 px-4 text-sm tracking-[0.1em] font-light hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.inStock ? 'ADD TO BAG' : 'OUT OF STOCK'}
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onWishlist?.(product);
              }}
              className="p-3 bg-white hover:bg-black hover:text-white transition-all duration-300"
              aria-label="Add to wishlist"
            >
              <Heart className="w-4 h-4" strokeWidth={1} />
            </button>
          </div>
        </div>

        {/* Quick View Icon */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsLightboxOpen(true);
          }}
          className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white"
          aria-label="View full size image"
        >
          <Eye className="w-4 h-4" strokeWidth={1} />
        </button>
      </div>

      {/* Product Info - Minimal & Elegant */}
      <div className="pt-4">
        {/* Category */}
        <p className="text-xs tracking-[0.2em] text-gray-500 mb-2">
          {toDisplayLabel(product.category || 'jewelry').toUpperCase()}
        </p>
        
        {/* Product Name */}
        <h3 className="font-serif text-lg font-light text-gray-900 mb-2 leading-tight">
          {product.name}
        </h3>
        
        {/* Price */}
        <div className="flex items-baseline gap-3">
          <span className="text-lg font-light tracking-wide">
            NPR {product.price.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">
              NPR {product.originalPrice!.toLocaleString()}
            </span>
          )}
        </div>

        {/* Material Tag */}
        <div className="mt-3">
          <span className="text-xs text-gray-600 tracking-[0.1em]">
            {(product.material === '925_silver' || product.material === '925-silver')
              ? '925 STERLING SILVER'
              : toDisplayLabel(product.material || 'material').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Image Lightbox */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        imageSrc={primaryImage}
        imageAlt={product.name}
        images={product.images}
        productName={product.name}
      />
    </div>
  );
};

export default ProductCard;
