import { Heart, Home, LayoutGrid, MessageCircle, ShoppingBag } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useCartContext } from '@/contexts/CartContext';

interface MobileTabBarProps {
  categoriesOpen: boolean;
  onOpenCategories: () => void;
}

const TAB = 'flex flex-col items-center justify-center gap-[3px] text-[11px]';

// Phone-only bottom navigation; App hides it on product pages and checkout,
// which get their own sticky action bars.
export default function MobileTabBar({ categoriesOpen, onOpenCategories }: MobileTabBarProps) {
  const [location] = useLocation();
  const { count, isOpen: cartOpen, openCart } = useCartContext();
  const tone = (active: boolean) => (active ? 'text-forest-900' : 'text-stone-600');

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_rgba(0,0,0,0.04)] md:hidden"
    >
      <Link href="/" className={cn(TAB, 'h-16', tone(location === '/' && !categoriesOpen && !cartOpen))}>
        <Home className="h-[22px] w-[22px]" strokeWidth={1.5} />
        Home
      </Link>
      <button
        type="button"
        onClick={onOpenCategories}
        className={cn(TAB, 'h-16', tone(categoriesOpen || location.startsWith('/collections') || location.startsWith('/shop-by')))}
      >
        <LayoutGrid className="h-[22px] w-[22px]" strokeWidth={1.5} />
        Categories
      </button>
      <Link href="/wishlist" className={cn(TAB, 'h-16', tone(location.startsWith('/wishlist')))}>
        <Heart className="h-[22px] w-[22px]" strokeWidth={1.5} />
        Wishlist
      </Link>
      <a
        href="https://wa.me/9779811469486?text=Hi%2C%20I%20need%20help%20choosing%20jewelry."
        target="_blank"
        rel="noopener noreferrer"
        className={cn(TAB, 'h-16 text-stone-600')}
      >
        <MessageCircle className="h-[22px] w-[22px] text-[#1f9d55]" strokeWidth={1.5} />
        Help
      </a>
      <button type="button" onClick={openCart} aria-label={`Open bag, ${count} items`} className={cn(TAB, 'h-16', tone(cartOpen))}>
        <span className="relative flex">
          <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.5} />
          {count > 0 && (
            <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-forest-900 px-1 text-[9px] text-white">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </span>
        Bag
      </button>
    </nav>
  );
}
