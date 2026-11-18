import { Link } from 'wouter';
import { STORE_CATEGORIES } from '@/components/CategorySheet';
import { JewelryProduct } from '@/types/jewelry';

// Horizontal on phones (scrolls), centred row on desktop.
export default function CategoryCircles({ products, className = '' }: { products: JewelryProduct[]; className?: string }) {
  return (
    <section aria-label="Shop by category" className={`mx-auto w-full max-w-[1280px] pt-5 md:pt-10 ${className}`}>
      {/* w-max + mx-auto: centred when it fits, scrolls from the first circle when it doesn't */}
      <div className="overflow-x-auto px-4 pb-1 [scrollbar-width:none] md:px-10">
      {/* md:gap-5: ten 100px circles fit the 1200px content width (the design's 28px gap overflowed) */}
      <div className="flex w-max gap-4 md:mx-auto md:gap-5">
        {STORE_CATEGORIES.map(category => {
          const image = products.find(p => p.category?.toLowerCase() === category.id)?.image;
          return (
            <Link
              key={category.id}
              href={`/shop-by/category/${category.id}`}
              className="flex w-[72px] flex-none flex-col items-center gap-2.5 md:w-[100px]"
            >
              <span className="flex h-[72px] w-[72px] items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-forest-100 font-serif text-[26px] text-forest-900 md:h-[100px] md:w-[100px]">
                {image ? <img src={image} alt="" loading="lazy" className="h-full w-full object-cover" /> : category.label[0]}
              </span>
              <span className="whitespace-nowrap text-xs text-stone-900">{category.label}</span>
            </Link>
          );
        })}
      </div>
      </div>
    </section>
  );
}
