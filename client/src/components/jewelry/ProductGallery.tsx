import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Star, X, ZoomIn } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: string[];
  name: string;
  rating?: number;
  reviewCount?: number;
  similarHref?: string;
}

const SWIPE_PX = 40;

// True only for a real mouse/trackpad; hover zoom would stick after a tap on touch screens.
function useFinePointer() {
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(hover: hover) and (pointer: fine)');
    setFine(query.matches);
    const onChange = () => setFine(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return fine;
}

const ARROW = 'absolute top-1/2 z-[3] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.92] text-stone-900 shadow-[0_2px_10px_rgba(0,0,0,0.08)]';

export default function ProductGallery({ images, name, rating, reviewCount, similarHref }: ProductGalleryProps) {
  const [index, setIndex] = useState(0);
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const finePointer = useFinePointer();
  const touchX = useRef<number | null>(null);
  const swiped = useRef(false);
  const count = images.length;

  const go = (next: number) => {
    setIndex(((next % count) + count) % count);
    setZoomed(false);
  };

  useEffect(() => { setIndex(0); }, [images.join('|')]);

  // Lightbox: lock page scroll; Escape closes, arrow keys step.
  useEffect(() => {
    if (!lightbox) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowRight') go(index + 1);
      if (e.key === 'ArrowLeft') go(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', onKey); };
  }, [lightbox, index]);

  const swipeHandlers = {
    onTouchStart: (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; },
    onTouchEnd: (e: React.TouchEvent) => {
      const start = touchX.current;
      touchX.current = null;
      if (start === null || zoomed) return;
      const dx = e.changedTouches[0].clientX - start;
      if (Math.abs(dx) > SWIPE_PX) { swiped.current = true; go(index + (dx < 0 ? 1 : -1)); }
    },
  };
  // A swipe ends with a click event; don't let it open the lightbox or toggle zoom.
  const consumeSwipe = () => { if (swiped.current) { swiped.current = false; return true; } return false; };

  if (count === 0) return null;
  const current = images[Math.min(index, count - 1)];

  return (
    <>
      <div className="-mx-4 flex min-w-0 gap-3 md:mx-0">
        {count > 1 && (
          <div className="relative hidden w-[76px] flex-none md:block">
            <div className="absolute inset-0 flex flex-col gap-2.5 overflow-y-auto [scrollbar-width:none]">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    'h-[95px] w-[76px] flex-none overflow-hidden rounded-lg border-2 bg-cream-card transition-opacity',
                    i === index ? 'border-forest-900 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="relative aspect-[4/5] min-w-0 flex-1 overflow-hidden bg-cream-card md:rounded-[14px]">
          <div
            role="button"
            tabIndex={0}
            aria-label={`Open ${name} image ${index + 1} full screen`}
            onClick={() => { if (!consumeSwipe()) { setLightbox(true); setZoomed(false); } }}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLightbox(true); } }}
            onMouseMove={e => {
              if (!finePointer) return;
              const r = e.currentTarget.getBoundingClientRect();
              setLens({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
            onMouseLeave={() => setLens(null)}
            {...swipeHandlers}
            className="absolute inset-0 cursor-zoom-in overflow-hidden"
          >
            <div
              className="flex h-full transition-transform duration-[450ms] ease-[cubic-bezier(.4,0,.2,1)]"
              style={{ transform: `translateX(-${index * 100}%)` }}
            >
              {images.map((src, i) => (
                <img
                  key={`${src}-${i}`}
                  src={src}
                  alt={i === index ? name : ''}
                  draggable={false}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  className="h-full w-full flex-none select-none object-cover"
                />
              ))}
            </div>
            {/* Hover magnifier: the same photo at 240%, following the cursor */}
            {finePointer && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-cream-card bg-no-repeat transition-opacity duration-150"
                style={{
                  backgroundImage: `url("${current}")`,
                  backgroundSize: '240%',
                  backgroundPosition: lens ? `${lens.x}% ${lens.y}%` : '50% 50%',
                  opacity: lens ? 1 : 0,
                }}
              />
            )}
          </div>

          {count > 1 && (
            <>
              <button type="button" onClick={() => go(index - 1)} aria-label="Previous image" className={cn(ARROW, 'left-3')}>
                <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Next image" className={cn(ARROW, 'right-3')}>
                <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.6} />
              </button>
            </>
          )}

          {similarHref && (
            <Link href={similarHref} className="absolute right-3 top-3 z-[3] flex h-[30px] items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs text-forest-900">
              <LayoutGrid className="h-[13px] w-[13px]" strokeWidth={1.6} />
              See similar
            </Link>
          )}

          {rating ? (
            <div className="absolute bottom-3 left-3 z-[3] flex h-[30px] items-center gap-1.5 rounded-full bg-white/95 px-3 text-xs text-stone-900">
              <Star className="h-3 w-3 fill-[#b8941f] text-[#b8941f]" strokeWidth={1} />
              <strong className="font-semibold">{rating.toFixed(1)}</strong>
              {reviewCount ? <><span className="text-stone-400">|</span>{reviewCount}</> : null}
            </div>
          ) : null}

          <div className="absolute bottom-3 right-3 z-[3] flex items-center gap-2">
            <span className="flex h-[30px] items-center rounded-full bg-stone-900/70 px-3 text-xs text-white">{index + 1} / {count}</span>
            <button
              type="button"
              onClick={() => { setLightbox(true); setZoomed(false); }}
              aria-label="Zoom image"
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/95 text-stone-900"
            >
              <ZoomIn className="h-[15px] w-[15px]" strokeWidth={1.7} />
            </button>
          </div>

          {count > 1 && (
            <div className="absolute inset-x-0 bottom-[52px] z-[3] flex justify-center gap-1.5 md:hidden">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={cn('h-[7px] rounded-full transition-all duration-300', i === index ? 'w-5 bg-forest-900' : 'w-[7px] bg-forest-900/30')}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label={`${name} images`} className="fixed inset-0 z-[60] flex flex-col bg-[#0f0e0d]">
          <div className="flex h-[60px] flex-none items-center justify-between px-4 text-white">
            <span className="text-[13px] text-stone-300">{index + 1} / {count} · {zoomed ? 'Tap to zoom out' : 'Tap image to zoom'}</span>
            <button
              type="button"
              autoFocus
              onClick={() => setLightbox(false)}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white"
            >
              <X className="h-5 w-5" strokeWidth={1.6} />
            </button>
          </div>
          <div
            onClick={e => {
              if (consumeSwipe()) return;
              const r = e.currentTarget.getBoundingClientRect();
              setOrigin(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
              setZoomed(z => !z);
            }}
            {...swipeHandlers}
            className={cn('relative flex min-h-0 flex-1 items-center justify-center overflow-hidden', zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in')}
          >
            <img
              src={current}
              alt={name}
              draggable={false}
              className="block max-h-full max-w-full select-none object-contain transition-transform duration-300 ease-out"
              style={{ transform: `scale(${zoomed ? 2.4 : 1})`, transformOrigin: origin }}
            />
            {count > 1 && (
              <>
                <button type="button" onClick={e => { e.stopPropagation(); go(index - 1); }} aria-label="Previous image" className={cn(ARROW, 'left-3')}>
                  <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.6} />
                </button>
                <button type="button" onClick={e => { e.stopPropagation(); go(index + 1); }} aria-label="Next image" className={cn(ARROW, 'right-3')}>
                  <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.6} />
                </button>
              </>
            )}
          </div>
          {count > 1 && (
            <div className="flex flex-none justify-center gap-2 overflow-x-auto px-4 pb-[calc(18px+env(safe-area-inset-bottom))] pt-3.5 [scrollbar-width:none]">
              {images.map((src, i) => (
                <button
                  key={`${src}-${i}`}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show image ${i + 1}`}
                  className={cn('h-[70px] w-14 flex-none overflow-hidden rounded-md border-2 bg-stone-800', i === index ? 'border-white opacity-100' : 'border-transparent opacity-60')}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
