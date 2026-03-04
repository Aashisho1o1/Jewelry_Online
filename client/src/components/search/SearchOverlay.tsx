import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { JewelryProduct } from '../../types/jewelry';
import ProductCard from '../jewelry/ProductCard';
import { useCartContext } from '../../contexts/CartContext';
import { useToast } from '../../hooks/use-toast';

interface SearchOverlayProps {
  products: JewelryProduct[];
  onClose: () => void;
}

type PriceFilter = 'all' | 'under2000' | '2000-5000' | 'above5000';

const PRICE_OPTIONS: { value: PriceFilter; label: string }[] = [
  { value: 'all', label: 'All Prices' },
  { value: 'under2000', label: 'Under NPR 2,000' },
  { value: '2000-5000', label: 'NPR 2,000 - 5,000' },
  { value: 'above5000', label: 'Above NPR 5,000' },
];

export default function SearchOverlay({ products, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');
  const [materialFilter, setMaterialFilter] = useState('all');
  const [occasionFilter, setOccasionFilter] = useState('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem, openCart } = useCartContext();
  const { toast } = useToast();

  // Autofocus on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Derive unique material and occasion values from products
  const materials = useMemo(() => {
    const raw = Array.from(new Set(products.map(p => p.material).filter(Boolean)));
    return raw.map(m => ({
      value: (m === '925_silver' || m === '925-silver') ? 'silver' : m!,
      label: (m === '925_silver' || m === '925-silver') ? '925 Silver' : m!.replace(/[_-]+/g, ' ').replace(/\b\w/g, (char: string) => char.toUpperCase()),
    })).filter((item, idx, arr) => arr.findIndex(a => a.value === item.value) === idx);
  }, [products]);

  const occasions = useMemo(() => {
    return Array.from(new Set(products.flatMap(p => p.occasions?.length ? p.occasions : p.occasion ? [p.occasion] : []).filter(Boolean))) as string[];
  }, [products]);

  // Filtered results
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products.filter(p => {
      const matchesQuery = !q ||
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.tags?.some(tag => tag.toLowerCase().includes(q)) ||
        p.styles?.some(style => style.toLowerCase().includes(q)) ||
        p.recipients?.some(recipient => recipient.toLowerCase().includes(q)) ||
        p.occasions?.some(occasion => occasion.toLowerCase().includes(q));

      const matchesPrice =
        priceFilter === 'all' ||
        (priceFilter === 'under2000' && p.price < 2000) ||
        (priceFilter === '2000-5000' && p.price >= 2000 && p.price <= 5000) ||
        (priceFilter === 'above5000' && p.price > 5000);

      const isSilver = p.material === '925_silver' || p.material === '925-silver';
      const matchesMaterial =
        materialFilter === 'all' ||
        (materialFilter === 'silver' && isSilver) ||
        p.material === materialFilter;

      const matchesOccasion =
        occasionFilter === 'all' ||
        p.occasion === occasionFilter ||
        p.occasions?.includes(occasionFilter);

      return matchesQuery && matchesPrice && matchesMaterial && matchesOccasion;
    });
  }, [products, query, priceFilter, materialFilter, occasionFilter]);

  const handleAddToCart = (product: JewelryProduct) => {
    if (!product.inStock) {
      toast({ title: 'Out of Stock', variant: 'destructive' });
      return;
    }
    addItem(product);
    toast({ title: 'Added to cart!', description: product.name });
    setTimeout(() => openCart(), 500);
  };

  const hasActiveFilters = priceFilter !== 'all' || materialFilter !== 'all' || occasionFilter !== 'all';

  const clearFilters = () => {
    setPriceFilter('all');
    setMaterialFilter('all');
    setOccasionFilter('all');
  };

  const filterBtn = (active: boolean) =>
    `px-4 py-1.5 text-xs tracking-[0.1em] font-light border transition-all duration-200 ${
      active ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-300 hover:border-black'
    }`;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      {/* Search Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" strokeWidth={1.5} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search rings, necklaces, earrings..."
            className="flex-1 text-lg font-light text-gray-900 placeholder-gray-400 bg-transparent outline-none tracking-wide"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 transition-colors"
            aria-label="Close search"
          >
            <X className="w-5 h-5 text-gray-600" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-gray-100 bg-gray-50 px-6 py-3">
        <div className="max-w-4xl mx-auto space-y-2">
          {/* Price filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[10px] tracking-[0.15em] text-gray-400 flex-shrink-0">PRICE</span>
            {PRICE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriceFilter(opt.value)}
                className={filterBtn(priceFilter === opt.value) + ' flex-shrink-0'}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Material + Occasion filters */}
          {(materials.length > 0 || occasions.length > 0) && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {materials.length > 0 && (
                <>
                  <span className="text-[10px] tracking-[0.15em] text-gray-400 flex-shrink-0">MATERIAL</span>
                  <button
                    type="button"
                    onClick={() => setMaterialFilter('all')}
                    className={filterBtn(materialFilter === 'all') + ' flex-shrink-0'}
                  >
                    All
                  </button>
                  {materials.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMaterialFilter(m.value)}
                      className={filterBtn(materialFilter === m.value) + ' flex-shrink-0'}
                    >
                      {m.label}
                    </button>
                  ))}
                </>
              )}

              {occasions.length > 0 && (
                <>
                  <span className="text-[10px] tracking-[0.15em] text-gray-400 ml-2 flex-shrink-0">OCCASION</span>
                  <button
                    type="button"
                    onClick={() => setOccasionFilter('all')}
                    className={filterBtn(occasionFilter === 'all') + ' flex-shrink-0'}
                  >
                    All
                  </button>
                  {occasions.map(occ => (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setOccasionFilter(occ)}
                      className={filterBtn(occasionFilter === occ) + ' flex-shrink-0'}
                    >
                      {occ.replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Active filter count + clear */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="text-[10px] tracking-[0.1em] text-gray-500 hover:text-black underline underline-offset-2 transition-colors"
              >
                CLEAR FILTERS
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-sm tracking-[0.15em]">LOADING COLLECTION...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm tracking-[0.15em] text-gray-400 mb-4">NO JEWELRY FOUND</p>
              <p className="text-xs text-gray-400">Try different keywords or clear the filters</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-xs tracking-[0.15em] text-gray-700 hover:text-black underline underline-offset-2"
                >
                  CLEAR FILTERS
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="text-xs tracking-[0.15em] text-gray-400 mb-6">
                {results.length} {results.length === 1 ? 'PIECE' : 'PIECES'} FOUND
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {results.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
