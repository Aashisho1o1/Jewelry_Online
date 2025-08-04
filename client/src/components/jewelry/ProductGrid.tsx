import React, { useState, useMemo } from 'react';
import { Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import { JewelryProduct, ProductFilter } from '../../types/jewelry';
import ProductCard from './ProductCard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { Checkbox } from '../ui/checkbox';
import { Slider } from '../ui/slider';
import { Separator } from '../ui/separator';

interface ProductGridProps {
  products: JewelryProduct[];
  title?: string;
  showFilters?: boolean;
  initialFilter?: ProductFilter;
  onAddToCart?: (product: JewelryProduct) => void;
  onWishlist?: (product: JewelryProduct) => void;
  className?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  title = "Our Collection",
  showFilters = true,
  initialFilter = {},
  onAddToCart,
  onWishlist,
  className = ""
}) => {
  const [filter, setFilter] = useState<ProductFilter>(initialFilter);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [priceRange, setPriceRange] = useState([1000, 10000]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Category filter
    if (filter.category && filter.category.length > 0) {
      filtered = filtered.filter(product => 
        filter.category!.includes(product.category)
      );
    }

    // Price filter
    if (filter.priceRange) {
      filtered = filtered.filter(product => 
        product.price.current >= filter.priceRange!.min &&
        product.price.current <= filter.priceRange!.max
      );
    }

    // Material filter
    if (filter.material && filter.material.length > 0) {
      filtered = filtered.filter(product => 
        filter.material!.includes(product.specifications.material)
      );
    }

    // Style filter
    if (filter.style && filter.style.length > 0) {
      filtered = filtered.filter(product => 
        product.style.some(style => filter.style!.includes(style))
      );
    }

    // In stock filter
    if (filter.inStock) {
      filtered = filtered.filter(product => product.availability.inStock);
    }

    // Sorting
    switch (filter.sortBy) {
      case 'price_low':
        filtered.sort((a, b) => a.price.current - b.price.current);
        break;
      case 'price_high':
        filtered.sort((a, b) => b.price.current - a.price.current);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.ratings?.count || 0) - (a.ratings?.count || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.ratings?.average || 0) - (a.ratings?.average || 0));
        break;
      default:
        // Default: featured first, then bestsellers
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          if (a.bestSeller && !b.bestSeller) return -1;
          if (!a.bestSeller && b.bestSeller) return 1;
          return 0;
        });
    }

    return filtered;
  }, [products, filter]);

  const categories = [
    { value: 'rings', label: 'Rings' },
    { value: 'necklaces', label: 'Necklaces' },
    { value: 'earrings', label: 'Earrings' },
    { value: 'bracelets', label: 'Bracelets' },
    { value: 'pendants', label: 'Pendants' },
    { value: 'sets', label: 'Jewelry Sets' },
  ];

  const materials = [
    { value: '925_silver', label: '925 Silver' },
    { value: 'silver_gold_plated', label: 'Gold Plated' },
    { value: 'silver_rose_gold_plated', label: 'Rose Gold Plated' },
  ];

  const styles = [
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'contemporary', label: 'Contemporary' },
    { value: 'traditional', label: 'Traditional' },
    { value: 'statement', label: 'Statement' },
    { value: 'delicate', label: 'Delicate' },
  ];

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.value} className="flex items-center space-x-2">
              <Checkbox
                id={category.value}
                checked={filter.category?.includes(category.value as any) || false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFilter(prev => ({
                      ...prev,
                      category: [...(prev.category || []), category.value as any]
                    }));
                  } else {
                    setFilter(prev => ({
                      ...prev,
                      category: prev.category?.filter(c => c !== category.value)
                    }));
                  }
                }}
              />
              <label htmlFor={category.value} className="text-sm font-medium">
                {category.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={setPriceRange}
            max={15000}
            min={500}
            step={100}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>NPR {priceRange[0].toLocaleString()}</span>
            <span>NPR {priceRange[1].toLocaleString()}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFilter(prev => ({
                ...prev,
                priceRange: { min: priceRange[0], max: priceRange[1] }
              }));
            }}
          >
            Apply Price Filter
          </Button>
        </div>
      </div>

      <Separator />

      {/* Materials */}
      <div>
        <h3 className="font-semibold mb-3">Material</h3>
        <div className="space-y-2">
          {materials.map((material) => (
            <div key={material.value} className="flex items-center space-x-2">
              <Checkbox
                id={material.value}
                checked={filter.material?.includes(material.value) || false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFilter(prev => ({
                      ...prev,
                      material: [...(prev.material || []), material.value]
                    }));
                  } else {
                    setFilter(prev => ({
                      ...prev,
                      material: prev.material?.filter(m => m !== material.value)
                    }));
                  }
                }}
              />
              <label htmlFor={material.value} className="text-sm font-medium">
                {material.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Styles */}
      <div>
        <h3 className="font-semibold mb-3">Style</h3>
        <div className="space-y-2">
          {styles.map((style) => (
            <div key={style.value} className="flex items-center space-x-2">
              <Checkbox
                id={style.value}
                checked={filter.style?.includes(style.value as any) || false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setFilter(prev => ({
                      ...prev,
                      style: [...(prev.style || []), style.value as any]
                    }));
                  } else {
                    setFilter(prev => ({
                      ...prev,
                      style: prev.style?.filter(s => s !== style.value)
                    }));
                  }
                }}
              />
              <label htmlFor={style.value} className="text-sm font-medium">
                {style.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* In Stock Only */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="inStock"
          checked={filter.inStock || false}
          onCheckedChange={(checked) => {
            setFilter(prev => ({ ...prev, inStock: checked as boolean }));
          }}
        />
        <label htmlFor="inStock" className="text-sm font-medium">
          In Stock Only
        </label>
      </div>

      {/* Clear Filters */}
      <Button
        variant="outline"
        onClick={() => {
          setFilter({});
          setPriceRange([1000, 10000]);
        }}
        className="w-full"
      >
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-muted-foreground">
            {filteredProducts.length} products found
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sort */}
          <Select
            value={filter.sortBy || ''}
            onValueChange={(value) => setFilter(prev => ({ ...prev, sortBy: value as any }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Featured</SelectItem>
              <SelectItem value="price_low">Price: Low to High</SelectItem>
              <SelectItem value="price_high">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Filter */}
          {showFilters && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      <div className="flex gap-6">
        {/* Desktop Filters */}
        {showFilters && (
          <div className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-6">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-4 w-4" />
                  <h3 className="font-semibold">Filters</h3>
                </div>
                <FilterContent />
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        <div className="flex-1">
          {filteredProducts.length > 0 ? (
            <div className={
              viewMode === 'grid' 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={onAddToCart}
                  onWishlist={onWishlist}
                  className={viewMode === 'list' ? 'flex' : ''}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Filter className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters to see more results
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setFilter({});
                  setPriceRange([1000, 10000]);
                }}
                className="mt-4"
              >
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductGrid;