import React, { useState } from 'react';
import { Heart, Eye } from 'lucide-react';
import { JewelryProduct } from '../../types/jewelry';
import ImageLightbox from '../ui/image-lightbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';

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
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const primaryImage = product.image || product.images?.[0] || '/images/jewelry/placeholder.svg';
  
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;
  const categoryLabel = toDisplayLabel(product.category || 'jewelry');
  const materialLabel = (product.material === '925_silver' || product.material === '925-silver')
    ? '925 STERLING SILVER'
    : toDisplayLabel(product.material || 'material').toUpperCase();
  const detailRows = [
    { label: 'Category', value: categoryLabel },
    { label: 'Material', value: materialLabel },
    { label: 'Weight', value: product.weight },
    { label: 'Dimensions', value: product.dimensions },
    { label: 'Stone Type', value: product.stoneType },
    { label: 'Occasion', value: product.occasion },
    { label: 'Availability', value: product.inStock ? 'In Stock' : 'Out of Stock' },
  ].filter(row => Boolean(row.value));

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
          {categoryLabel.toUpperCase()}
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
            {materialLabel}
          </span>
        </div>

        {/* Details Button */}
        <button
          onClick={() => setIsDetailsOpen(true)}
          className="mt-3 text-xs tracking-[0.15em] text-gray-700 hover:text-black underline underline-offset-4 transition-colors"
        >
          VIEW DETAILS
        </button>
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

      {/* Product Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl font-light">{product.name}</DialogTitle>
            <DialogDescription className="text-sm tracking-[0.08em] uppercase text-gray-500">
              {categoryLabel} • NPR {product.price.toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full max-h-72 object-cover rounded-md bg-gray-100"
              loading="lazy"
            />

            {product.description && (
              <p className="text-sm text-gray-700 leading-relaxed">{product.description}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {detailRows.map(row => (
                <div key={row.label} className="border border-gray-200 rounded-md px-3 py-2">
                  <p className="text-[11px] tracking-[0.12em] text-gray-500 uppercase">{row.label}</p>
                  <p className="text-sm text-gray-900 mt-1">{row.value}</p>
                </div>
              ))}
            </div>

            {Boolean(product.images?.length && product.images.length > 1) && (
              <button
                onClick={() => {
                  setIsDetailsOpen(false);
                  setIsLightboxOpen(true);
                }}
                className="w-fit text-xs tracking-[0.15em] text-gray-700 hover:text-black underline underline-offset-4 transition-colors"
              >
                VIEW GALLERY ({product.images?.length})
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductCard;
