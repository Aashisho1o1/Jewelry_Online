import React, { useState } from 'react';
import { Heart, ShoppingCart, Star, Tag } from 'lucide-react';
import { JewelryProduct } from '../../types/jewelry';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';

interface ProductCardProps {
  product: JewelryProduct;
  onAddToCart?: (product: JewelryProduct) => void;
  onWishlist?: (product: JewelryProduct) => void;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onWishlist,
  className = ""
}) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    onWishlist?.(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const discountPercentage = product.price.discount || 0;
  const hasDiscount = discountPercentage > 0;

  return (
    <Card className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-0 bg-white ${className}`}>
      <div className="relative">
        {/* Product Image */}
        <div className="aspect-square overflow-hidden bg-gradient-to-br from-silver-50 to-silver-100">
          {!imageError ? (
            <img
              src={product.images.main}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-silver-100 to-silver-200">
              <div className="text-center">
                <div className="mx-auto h-16 w-16 rounded-full bg-silver-300 flex items-center justify-center mb-2">
                  <Tag className="h-8 w-8 text-silver-600" />
                </div>
                <p className="text-sm text-silver-600 font-medium">{product.name}</p>
              </div>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.newArrival && (
            <Badge className="bg-accent text-accent-foreground font-medium">
              New
            </Badge>
          )}
          {product.bestSeller && (
            <Badge className="bg-secondary text-secondary-foreground font-medium">
              Bestseller
            </Badge>
          )}
          {hasDiscount && (
            <Badge className="bg-destructive text-destructive-foreground font-medium">
              -{discountPercentage}%
            </Badge>
          )}
        </div>

        {/* Wishlist Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-3 right-3 h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-white/20"
          onClick={handleWishlistClick}
        >
          <Heart
            className={`h-4 w-4 transition-colors ${
              isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }`}
          />
        </Button>

        {/* Quick Add to Cart - appears on hover */}
        <div className="absolute inset-x-3 bottom-3 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            onClick={handleAddToCart}
            className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium"
            size="sm"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Product Name */}
        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Material & Features */}
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs border-silver-300 text-silver-700">
            925 Silver
          </Badge>
          {product.features.hypoallergenic && (
            <Badge variant="outline" className="text-xs border-green-300 text-green-700">
              Hypoallergenic
            </Badge>
          )}
        </div>

        {/* Rating */}
        {product.ratings && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium text-foreground ml-1">
                {product.ratings.average}
              </span>
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.ratings.count})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">
            NPR {product.price.current.toLocaleString()}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              NPR {product.price.original.toLocaleString()}
            </span>
          )}
        </div>

        {/* Style Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {product.style.slice(0, 2).map((style) => (
            <span
              key={style}
              className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full capitalize"
            >
              {style.replace('_', ' ')}
            </span>
          ))}
        </div>

        {/* Stock Status */}
        {!product.availability.inStock && (
          <div className="mt-2">
            <Badge variant="destructive" className="text-xs">
              Out of Stock
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductCard;