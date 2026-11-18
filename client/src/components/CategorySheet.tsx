import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { getProducts } from '@/data/product-loader';
import { getFacetOptions } from '@/lib/product-taxonomy';
import { JewelryProduct } from '@/types/jewelry';

// Wedding categories are listed even before they have products online;
// their pages show a "Not online yet, ask on WhatsApp" message.
export const STORE_CATEGORIES = [
  { id: 'rings', label: 'Rings' },
  { id: 'necklaces', label: 'Necklaces' },
  { id: 'earrings', label: 'Earrings' },
  { id: 'bracelets', label: 'Bracelets' },
  { id: 'sets', label: 'Sets' },
  { id: 'tilahari', label: 'Tilahari' },
  { id: 'mangalsutra', label: 'Mangalsutra' },
  { id: 'pote', label: 'Pote' },
  { id: 'pauju', label: 'Pauju' },
  { id: 'maang-tika', label: 'Maang Tika' },
];

const BUDGET_TONES = [
  'bg-forest-900 text-white',
  'bg-forest-100 text-forest-900',
  'bg-cream-card text-stone-900',
  'bg-forest-700 text-white',
];

const MORE_LINKS = [
  { label: 'Gift guide', href: '/shop-by' },
  { label: "Today's gold & silver rate", href: '/rates' },
  { label: 'My orders', href: '/my-orders' },
  { label: 'Our story', href: '/about' },
];

interface CategorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CategorySheet({ open, onOpenChange }: CategorySheetProps) {
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<JewelryProduct[]>([]);

  useEffect(() => {
    if (open && products.length === 0) getProducts().then(setProducts).catch(() => {});
  }, [open, products.length]);

  const categories = useMemo(() => STORE_CATEGORIES.map(category => ({
    ...category,
    image: products.find(p => p.category?.toLowerCase() === category.id)?.image,
  })), [products]);

  const budgets = useMemo(() => getFacetOptions(products, 'price'), [products]);

  const go = (href: string) => {
    onOpenChange(false);
    navigate(href);
    window.scrollTo(0, 0);
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Shop by category">
      <div className="grid grid-cols-4 gap-x-2 gap-y-4">
        {categories.map(category => (
          <button
            key={category.id}
            type="button"
            onClick={() => go(`/shop-by/category/${category.id}`)}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-forest-100 font-serif text-[22px] text-forest-900">
              {category.image
                ? <img src={category.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                : category.label[0]}
            </span>
            <span className="text-center text-xs leading-tight text-stone-900">{category.label}</span>
          </button>
        ))}
      </div>

      {budgets.length > 0 && (
        <>
          <p className="mb-3 mt-6 text-[11px] uppercase tracking-[0.2em] text-stone-600">Shop by budget</p>
          <div className="grid grid-cols-2 gap-2">
            {budgets.map((budget, i) => (
              <button
                key={budget.slug}
                type="button"
                onClick={() => go(`/shop-by/price/${budget.slug}`)}
                className={`h-[52px] rounded-xl text-[13px] font-medium ${BUDGET_TONES[i % BUDGET_TONES.length]}`}
              >
                {budget.label}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-6 border-t border-stone-200">
        {MORE_LINKS.map(link => (
          <button
            key={link.href}
            type="button"
            onClick={() => go(link.href)}
            className="flex h-12 w-full items-center border-b border-stone-100 text-left text-[15px] text-stone-800"
          >
            {link.label}
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
