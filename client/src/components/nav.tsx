import { Link, useLocation } from 'wouter';
import { Heart, Menu, MessageCircle, Search, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartContext } from '../contexts/CartContext';
import { useEngagementContext } from '@/contexts/EngagementContext';
import { useEffect, useState } from 'react';
import { JewelryProduct } from '../types/jewelry';
import { getProducts } from '../data/product-loader';
import SearchOverlay from './search/SearchOverlay';

export default function Nav() {
  const [location, navigate] = useLocation();
  const { count, openCart } = useCartContext();
  const { wishlistCount } = useEngagementContext();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchProducts, setSearchProducts] = useState<JewelryProduct[]>([]);

  useEffect(() => {
    getProducts().then(setSearchProducts).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const scrollToSection = (sectionId: string) => {
    const performScroll = () => {
      const element = document.getElementById(sectionId);
      if (!element) {
        window.location.hash = sectionId;
        return;
      }

      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', `/#${sectionId}`);
    };

    if (location !== '/') {
      navigate('/');
      window.setTimeout(performScroll, 120);
      return;
    }

    performScroll();
  };

  const links = [
    { label: 'Shop', onClick: () => scrollToSection('catalog'), active: location === '/' },
    { label: 'Best Sellers', onClick: () => scrollToSection('bestsellers'), active: false },
    { label: 'Rates', onClick: () => navigate('/rates'), active: location.startsWith('/rates') },
    { label: 'Gift Guide', onClick: () => navigate('/shop-by'), active: location.startsWith('/shop-by') },
    { label: 'About', onClick: () => navigate('/about'), active: location.startsWith('/about') },
    { label: 'My Orders', onClick: () => navigate('/my-orders'), active: location.startsWith('/my-orders') },
  ];

  const linkClass = (active: boolean) =>
    cn(
      'text-[12px] uppercase tracking-[0.14em] transition-colors duration-200',
      active ? 'text-stone-950' : 'text-stone-600 hover:text-stone-950'
    );

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b border-stone-200 bg-white/95 backdrop-blur-md">
        <div className="container">
          <div className="flex h-16 items-center justify-between md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              className="p-2 -ml-2 text-stone-700 transition-colors hover:text-stone-950"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
            </button>

            <Link href="/" className="flex flex-col items-center">
              <h1 className="text-lg font-serif font-light tracking-[0.2em] text-stone-950">AASHISH</h1>
              <p className="text-[8px] tracking-[0.28em] text-stone-500">JEWELLERS</p>
            </Link>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                aria-label="Search products"
                className="p-2 text-stone-700 transition-colors hover:text-stone-950"
              >
                <Search className="h-5 w-5" strokeWidth={1.5} />
              </button>
              <Link href="/wishlist" className="relative p-2 text-stone-700 transition-colors hover:text-stone-950" aria-label="Wishlist">
                <Heart className="h-5 w-5" strokeWidth={1.5} />
                {wishlistCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-950 text-[9px] text-white">
                    {wishlistCount > 9 ? '9+' : wishlistCount}
                  </span>
                )}
              </Link>
              <button
                type="button"
                onClick={openCart}
                aria-label="Open cart"
                className="relative p-2 text-stone-700 transition-colors hover:text-stone-950"
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
                {count > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-950 text-[9px] text-white">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="hidden h-[72px] grid-cols-[1fr_auto_1fr] items-center md:grid">
            <div className="flex items-center gap-7">
              {links.slice(0, 2).map(link => (
                <button key={link.label} type="button" onClick={link.onClick} className={linkClass(link.active)}>
                  {link.label}
                </button>
              ))}
            </div>

            <Link href="/" className="flex flex-col items-center">
              <h1 className="text-xl font-serif font-light tracking-[0.22em] text-stone-950">AASHISH</h1>
              <p className="text-[9px] tracking-[0.28em] text-stone-500">JEWELLERS</p>
            </Link>

            <div className="flex items-center justify-end gap-6">
              <div className="flex items-center gap-7">
                {links.slice(2).map(link => (
                  <button key={link.label} type="button" onClick={link.onClick} className={linkClass(link.active)}>
                    {link.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  aria-label="Search products"
                  className="p-2 text-stone-600 transition-colors hover:text-stone-950"
                >
                  <Search className="h-[18px] w-[18px]" strokeWidth={1.5} />
                </button>
                <Link href="/wishlist" aria-label="Wishlist" className="relative p-2 text-stone-600 transition-colors hover:text-stone-950">
                  <Heart className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {wishlistCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-950 text-[9px] text-white">
                      {wishlistCount > 9 ? '9+' : wishlistCount}
                    </span>
                  )}
                </Link>
                <button
                  type="button"
                  onClick={openCart}
                  aria-label="Open cart"
                  className="relative p-2 text-stone-600 transition-colors hover:text-stone-950"
                >
                  <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  {count > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-stone-950 text-[9px] text-white">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="absolute left-0 right-0 top-16 z-50 border-t border-stone-200 bg-white shadow-[0_20px_40px_rgba(0,0,0,0.06)] md:hidden">
            <nav className="px-6 py-5">
              <div className="grid gap-1">
                {[...links, { label: 'Wishlist', onClick: () => navigate('/wishlist'), active: location.startsWith('/wishlist') }].map(link => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => {
                      link.onClick();
                      setMobileMenuOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between border-b border-stone-200 py-4 text-left text-sm uppercase tracking-[0.16em] transition-colors last:border-0',
                      link.active ? 'text-stone-950' : 'text-stone-700'
                    )}
                  >
                    {link.label}
                  </button>
                ))}
              </div>

              <a
                href="https://wa.me/9779811469486?text=Hi%2C%20I%20need%20help%20choosing%20jewelry."
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm uppercase tracking-[0.16em] text-stone-800"
              >
                <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                WhatsApp Help
              </a>
            </nav>
          </div>
        )}
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
      )}

      {isSearchOpen && <SearchOverlay products={searchProducts} onClose={() => setIsSearchOpen(false)} />}
    </>
  );
}
