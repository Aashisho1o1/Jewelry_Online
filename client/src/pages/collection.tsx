import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useRoute, useSearch } from 'wouter';
import { ArrowUpDown, Check, ListFilter } from 'lucide-react';
import { JewelryProduct } from '@/types/jewelry';
import { getProducts } from '@/data/product-loader';
import ProductCard from '@/components/jewelry/ProductCard';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { STORE_CATEGORIES } from '@/components/CategorySheet';
import { useCartContext } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { PRICE_BUCKETS, formatProductLabel } from '@/lib/product-taxonomy';
import SiteMeta from '@/components/SiteMeta';
import { cn } from '@/lib/utils';

const SORTS = [
  { id: 'featured', label: 'Featured', short: 'Featured' },
  { id: 'low', label: 'Price: low to high', short: 'Price ↑' },
  { id: 'high', label: 'Price: high to low', short: 'Price ↓' },
] as const;
type SortId = typeof SORTS[number]['id'];

const categoryLabel = (id: string) => STORE_CATEGORIES.find(c => c.id === id)?.label || formatProductLabel(id);

// Filters live in the URL (category in the path, price/sort in the query) so links can be shared and Back works.
function buildHref(category: string | null, price: string | null, sort: SortId) {
  const params = new URLSearchParams();
  if (price) params.set('price', price);
  if (sort !== 'featured') params.set('sort', sort);
  const query = params.toString();
  return `/collections${category ? `/${category}` : ''}${query ? `?${query}` : ''}`;
}

function Box({ on, round = false }: { on: boolean; round?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-[18px] w-[18px] shrink-0 items-center justify-center border',
        round ? 'rounded-full' : 'rounded',
        on ? 'border-forest-900' : 'border-stone-300',
        on && !round && 'bg-forest-900 text-white'
      )}
    >
      {on && (round ? <span className="h-2.5 w-2.5 rounded-full bg-forest-900" /> : <Check className="h-3 w-3" strokeWidth={3} />)}
    </span>
  );
}

interface FilterOption { id: string; label: string; count: number; on: boolean; onToggle: () => void }

function FilterList({ title, options, round, large = false }: { title: string; options: FilterOption[]; round?: boolean; large?: boolean }) {
  if (options.length === 0) return null;
  return (
    <fieldset>
      <legend className="mb-3 text-[11px] uppercase tracking-[0.2em] text-stone-600">{title}</legend>
      <div className={cn('flex flex-col', large ? '' : 'gap-1')}>
        {options.map(option => (
          <button
            key={option.id}
            type="button"
            role={round ? 'radio' : 'checkbox'}
            aria-checked={option.on}
            onClick={option.onToggle}
            className={cn(
              'flex w-full items-center gap-2.5 text-left text-stone-900',
              large ? 'h-12 border-b border-cream-card text-[15px]' : 'h-9 text-sm'
            )}
          >
            <Box on={option.on} round={round} />
            <span className="flex-1">{option.label}</span>
            <span className={cn('text-stone-500', large ? 'text-[13px]' : 'text-xs')}>{option.count}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function CollectionPage() {
  const [, params] = useRoute('/collections/:category');
  const search = useSearch();
  const [, navigate] = useLocation();
  const [products, setProducts] = useState<JewelryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState<'filter' | 'sort' | null>(null);
  const { addItem, openCart } = useCartContext();
  const { toast } = useToast();

  useEffect(() => {
    getProducts().then(setProducts).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const category = params?.category ? decodeURIComponent(params.category).toLowerCase() : null;
  const query = new URLSearchParams(search);
  const priceSlug = PRICE_BUCKETS.some(b => b.slug === query.get('price')) ? query.get('price') : null;
  const sort: SortId = SORTS.some(s => s.id === query.get('sort')) ? (query.get('sort') as SortId) : 'featured';
  const go = (next: { category?: string | null; price?: string | null; sort?: SortId }) => navigate(buildHref(
    next.category !== undefined ? next.category : category,
    next.price !== undefined ? next.price : priceSlug,
    next.sort ?? sort,
  ));

  const inCategory = useMemo(
    () => (category ? products.filter(p => p.category?.toLowerCase() === category) : products),
    [products, category]
  );
  const priceBucket = PRICE_BUCKETS.find(b => b.slug === priceSlug);
  const list = useMemo(() => {
    const filtered = priceBucket ? inCategory.filter(priceBucket.match) : inCategory;
    const sorted = [...filtered];
    if (sort === 'low') sorted.sort((a, b) => a.price - b.price);
    else if (sort === 'high') sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || (b.rating || 0) - (a.rating || 0));
    return sorted;
  }, [inCategory, priceBucket, sort]);

  // Only categories with pieces online appear as filters; the current one stays visible even if empty.
  const categoryOptions: FilterOption[] = STORE_CATEGORIES
    .map(c => ({ ...c, count: products.filter(p => p.category?.toLowerCase() === c.id).length }))
    .filter(c => c.count > 0 || c.id === category)
    .map(c => ({ id: c.id, label: c.label, count: c.count, on: category === c.id, onToggle: () => go({ category: category === c.id ? null : c.id }) }));
  const priceOptions: FilterOption[] = PRICE_BUCKETS
    .map(b => ({ ...b, count: inCategory.filter(b.match).length }))
    .filter(b => b.count > 0 || b.slug === priceSlug)
    .map(b => ({ id: b.slug, label: b.label, count: b.count, on: priceSlug === b.slug, onToggle: () => go({ price: priceSlug === b.slug ? null : b.slug }) }));

  const filterCount = (category ? 1 : 0) + (priceSlug ? 1 : 0);
  const title = category ? categoryLabel(category) : priceBucket ? priceBucket.label : 'All jewellery';
  const countText = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;
  const clearAll = () => navigate(buildHref(null, null, sort));
  const nothingOnline = !loading && category !== null && inCategory.length === 0;

  const handleAddToCart = (product: JewelryProduct) => {
    if (!product.inStock) {
      toast({ title: 'Out of Stock', description: 'This item is currently out of stock.', variant: 'destructive' });
      return;
    }
    addItem(product);
    toast({ title: 'Added to bag', description: `${product.name} added to your cart.` });
    setTimeout(() => openCart(), 500);
  };

  return (
    <div className="min-h-screen bg-cream">
      <SiteMeta
        title={`${title} | Aashish Jewellers`}
        description={`Shop ${title.toLowerCase()} in 925 sterling silver, handcrafted in Butwal and delivered across Nepal.`}
      />
      <section className="mx-auto max-w-[1280px] px-4 pb-11 pt-4 md:px-10 md:pb-20 md:pt-7">
        <nav aria-label="Breadcrumb" className="text-xs text-stone-500">
          <Link href="/" className="py-2 hover:text-forest-900">Home</Link>
          <span className="mx-1.5">/</span>
          {category ? <Link href="/collections" className="py-2 hover:text-forest-900">Shop</Link> : <span className="text-stone-700">Shop</span>}
          {category && <><span className="mx-1.5">/</span><span className="text-stone-700">{title}</span></>}
        </nav>

        <div className="mb-6 mt-2.5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-[28px] font-normal text-stone-900 md:text-[40px]">{title}</h1>
            <p className="mt-1.5 text-[13px] text-stone-500">{loading ? 'Loading…' : countText}</p>
          </div>
          <label className="hidden items-center gap-2 text-xs text-stone-600 md:flex">
            Sort
            <select
              value={sort}
              onChange={e => go({ sort: e.target.value as SortId })}
              className="h-10 rounded-full border border-stone-300 bg-white px-3 text-[13px] text-stone-900"
            >
              {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
        </div>

        {/* Phone toolbar: sticks under the 110px header */}
        <div className="sticky top-[110px] z-20 -mx-4 mb-4 flex flex-col gap-2.5 border-b border-stone-200 bg-cream/[0.97] px-4 py-2.5 md:hidden">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
            {[{ id: null as string | null, label: 'All' }, ...categoryOptions.map(c => ({ id: c.id as string | null, label: c.label }))].map(chip => {
              const on = chip.id === category;
              return (
                <button
                  key={chip.id ?? 'all'}
                  type="button"
                  aria-pressed={on}
                  onClick={() => go({ category: chip.id })}
                  className={cn('h-9 flex-none rounded-full border px-3.5 text-[13px]', on ? 'border-forest-900 bg-forest-900 text-white' : 'border-stone-300 bg-white text-stone-900')}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setSheet('sort')} className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-stone-300 bg-white text-[13px] text-stone-900">
              <ArrowUpDown className="h-4 w-4" strokeWidth={1.5} />
              Sort · {SORTS.find(s => s.id === sort)?.short}
            </button>
            <button type="button" onClick={() => setSheet('filter')} className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-stone-300 bg-white text-[13px] text-stone-900">
              <ListFilter className="h-4 w-4" strokeWidth={1.5} />
              Filter
              {filterCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-forest-900 px-1.5 text-[11px] text-white">{filterCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="grid items-start gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:gap-12">
          <aside className="hidden md:block">
            <div className="sticky top-24 flex flex-col gap-7">
              <FilterList title="Category" options={categoryOptions} />
              <FilterList title="Price" options={priceOptions} round />
              {filterCount > 0 && (
                <button type="button" onClick={clearAll} className="self-start text-[13px] text-forest-900 underline underline-offset-4">
                  Clear all filters
                </button>
              )}
            </div>
          </aside>

          <div>
            {loading ? (
              <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-forest-900" /></div>
            ) : nothingOnline ? (
              // Wedding categories are sold in store before they're photographed for the site.
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
                <p className="font-serif text-[22px] text-stone-900">Not online yet</p>
                <p className="mx-auto mt-2 max-w-[360px] text-sm leading-relaxed text-stone-600">
                  These pieces are available in store in Butwal. Ask us on WhatsApp for photos and pricing.
                </p>
                <a
                  href={`https://wa.me/9779811469486?text=${encodeURIComponent(`Hi, I'm looking for ${title} designs.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex h-11 items-center rounded-full bg-forest-900 px-6 text-[11px] uppercase tracking-[0.16em] text-white hover:bg-forest-700"
                >
                  Ask on WhatsApp
                </a>
              </div>
            ) : list.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
                <p className="font-serif text-[22px] text-stone-900">No pieces match these filters</p>
                <button type="button" onClick={clearAll} className="mt-5 inline-flex h-11 items-center rounded-full border border-forest-900 px-6 text-[11px] uppercase tracking-[0.16em] text-forest-900">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6">
                {list.map(product => <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />)}
              </div>
            )}
          </div>
        </div>
      </section>

      <BottomSheet
        open={sheet === 'filter'}
        onOpenChange={open => setSheet(open ? 'filter' : null)}
        title="Filter"
        footer={
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            <button type="button" onClick={clearAll} className="h-[50px] rounded-[10px] border border-stone-300 bg-white text-[13px] text-stone-900">Clear</button>
            <button type="button" onClick={() => setSheet(null)} className="h-[50px] rounded-[10px] bg-forest-900 text-xs font-semibold uppercase tracking-[0.12em] text-white">
              Show {countText}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-5 pt-1">
          <FilterList title="Category" options={categoryOptions} large />
          <FilterList title="Price" options={priceOptions} round large />
        </div>
      </BottomSheet>

      <BottomSheet open={sheet === 'sort'} onOpenChange={open => setSheet(open ? 'sort' : null)} title="Sort by">
        <div role="radiogroup" aria-label="Sort by">
          {SORTS.map(s => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={sort === s.id}
              onClick={() => { go({ sort: s.id }); setSheet(null); }}
              className="flex h-[54px] w-full items-center justify-between border-b border-cream-card text-left text-[15px] text-stone-900"
            >
              {s.label}
              <Box on={sort === s.id} round />
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  );
}
