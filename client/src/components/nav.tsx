import { Link, useLocation } from 'wouter';
import { Heart, Menu, Search, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartContext } from '../contexts/CartContext';
import { useEngagementContext } from '@/contexts/EngagementContext';
import { useEffect, useState } from 'react';
import { JewelryProduct } from '../types/jewelry';
import { getProducts } from '../data/product-loader';
import SearchOverlay from './search/SearchOverlay';

interface NavProps {
  onOpenCategories: () => void;
}

const SEARCH_HINT = 'Search rings, jhumkas, sets';

function Badge({ value }: { value: number }) {
  if (value <= 0) return null;
  return (
    <span className="absolute right-0.5 top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-forest-900 px-1 text-[10px] text-white">
      {value > 9 ? '9+' : value}
    </span>
  );
}

function Logo({ size }: { size: 'sm' | 'lg' }) {
  return (
    <Link href="/" className="flex flex-col items-center" aria-label="Aashish Jewellers home">
      <span className={cn('font-serif leading-[1.1] text-stone-900', size === 'lg' ? 'text-[21px] tracking-[0.22em]' : 'text-lg tracking-[0.2em]')}>
        AASHISH
      </span>
      <span className={cn('text-stone-500', size === 'lg' ? 'text-[9px] tracking-[0.3em]' : 'text-[8px] tracking-[0.28em]')}>
        JEWELLERS
      </span>
    </Link>
  );
}

export default function Nav({ onOpenCategories }: NavProps) {
  const [location, navigate] = useLocation();
  const { count, openCart } = useCartContext();
  const { wishlistCount } = useEngagementContext();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchProducts, setSearchProducts] = useState<JewelryProduct[]>([]);

  useEffect(() => {
    getProducts().then(setSearchProducts).catch(() => {});
  }, []);

  const links = [
    { label: 'Shop All', onClick: () => navigate('/shop-by/category/all'), active: location === '/shop-by/category/all' },
    ...['rings', 'necklaces', 'earrings', 'bracelets'].map(id => ({
      label: id.charAt(0).toUpperCase() + id.slice(1),
      onClick: () => navigate(`/shop-by/category/${id}`),
      active: location === `/shop-by/category/${id}`,
    })),
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/[0.97] backdrop-blur-[8px]">
        {/* Desktop and tablet */}
        <div className="mx-auto hidden h-[76px] max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-6 px-10 md:grid">
          <nav className="flex min-w-0 gap-4 xl2:gap-[26px]">
            {links.map((link, i) => (
              <button
                key={link.label}
                type="button"
                onClick={link.onClick}
                // Tablets (768-1120px) show only the first three links.
                className={cn(
                  'whitespace-nowrap border-b py-1.5 text-xs uppercase tracking-[0.14em] transition-colors',
                  i >= 3 && 'hidden xl2:block',
                  link.active ? 'border-forest-900 text-forest-900' : 'border-transparent text-stone-600 hover:text-forest-900'
                )}
              >
                {link.label}
              </button>
            ))}
          </nav>

          <Logo size="lg" />

          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="mr-1.5 hidden h-10 min-w-0 max-w-[240px] flex-1 items-center gap-2 overflow-hidden whitespace-nowrap rounded-full border border-stone-200 bg-cream px-3.5 text-[13px] text-stone-500 transition-colors hover:border-stone-300 xl2:flex"
            >
              <Search className="h-4 w-4 shrink-0" strokeWidth={1.5} />
              {SEARCH_HINT}
            </button>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search products"
              className="flex h-10 w-10 items-center justify-center text-stone-700 hover:text-forest-900 xl2:hidden"
            >
              <Search className="h-[19px] w-[19px]" strokeWidth={1.5} />
            </button>
            <Link href="/wishlist" aria-label="Wishlist" className="relative flex h-10 w-10 items-center justify-center text-stone-700 hover:text-forest-900">
              <Heart className="h-[19px] w-[19px]" strokeWidth={1.5} />
              <Badge value={wishlistCount} />
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label="Open cart"
              className="relative flex h-10 w-10 items-center justify-center text-stone-700 hover:text-forest-900"
            >
              <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={1.5} />
              <Badge value={count} />
            </button>
          </div>
        </div>

        {/* Phone: icon row, then an always-visible search pill */}
        <div className="md:hidden">
          <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-2">
            <button
              type="button"
              onClick={onOpenCategories}
              aria-label="Open menu"
              className="flex h-11 w-11 items-center justify-center justify-self-start text-stone-700"
            >
              <Menu className="h-5 w-5" strokeWidth={1.5} />
            </button>
            <Logo size="sm" />
            <div className="flex justify-self-end">
              <Link href="/wishlist" aria-label="Wishlist" className="relative flex h-11 w-11 items-center justify-center text-stone-700">
                <Heart className="h-[19px] w-[19px]" strokeWidth={1.5} />
                <Badge value={wishlistCount} />
              </Link>
              <button
                type="button"
                onClick={openCart}
                aria-label="Open cart"
                className="relative flex h-11 w-11 items-center justify-center text-stone-700"
              >
                <ShoppingBag className="h-[19px] w-[19px]" strokeWidth={1.5} />
                <Badge value={count} />
              </button>
            </div>
          </div>
          <div className="px-4 pb-3">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search products"
              className="flex h-[42px] w-full items-center gap-2 rounded-full border border-stone-200 bg-cream px-3.5 text-[13px] text-stone-500"
            >
              <Search className="h-4 w-4" strokeWidth={1.5} />
              {SEARCH_HINT}
            </button>
          </div>
        </div>
      </header>

      {isSearchOpen && <SearchOverlay products={searchProducts} onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
