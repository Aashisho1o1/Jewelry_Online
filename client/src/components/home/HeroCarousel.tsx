import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

export interface HeroSlide {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  image: string;
  imagePosition?: string;
  tone: 'forest' | 'cream' | 'mint';
}

const TONES = {
  forest: { bg: 'bg-forest-900', title: 'text-white', sub: 'text-[#d5e2d8]', btn: 'bg-white text-forest-900', dot: 'bg-white', dotIdle: 'bg-white/50' },
  cream: { bg: 'bg-cream-card', title: 'text-stone-900', sub: 'text-stone-600', btn: 'bg-forest-900 text-white', dot: 'bg-forest-900', dotIdle: 'bg-forest-900/30' },
  mint: { bg: 'bg-forest-100', title: 'text-forest-900', sub: 'text-forest-600', btn: 'bg-forest-900 text-white', dot: 'bg-forest-900', dotIdle: 'bg-forest-900/30' },
};

const AUTOPLAY_MS = 5500;

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  // Auto-advance, but never while someone is reading/interacting or prefers less motion.
  useEffect(() => {
    if (paused || reducedMotion || count < 2) return;
    const timer = window.setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, reducedMotion, count, go]);

  if (count === 0) return null;
  const tone = TONES[slides[index].tone] || TONES.forest;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={e => { setPaused(true); touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const start = touchStartX.current;
        touchStartX.current = null;
        if (start === null) return;
        const dx = e.changedTouches[0].clientX - start;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
      className="relative mx-4 mt-5 h-[440px] overflow-hidden rounded-2xl md:mx-0 md:mt-0 md:h-[560px] md:rounded-none"
    >
      <div
        className={cn('flex h-full', !reducedMotion && 'transition-transform duration-700 ease-[cubic-bezier(.6,0,.2,1)]')}
        style={{ width: `${count * 100}%`, transform: `translateX(-${(index * 100) / count}%)` }}
      >
        {slides.map((slide, i) => {
          const t = TONES[slide.tone] || TONES.forest;
          const active = i === index;
          return (
            <div
              key={slide.title}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              className={cn('grid h-full grid-rows-[58%_42%] md:grid-cols-2 md:grid-rows-1', t.bg)}
              style={{ width: `${100 / count}%` }}
            >
              {/* md:px-20 clears the 44px arrow buttons sitting 16px from the edge */}
              <div className="flex min-w-0 flex-col items-start justify-center px-[18px] pb-[30px] pt-3.5 md:order-first md:px-20 md:py-14">
                <p className={cn('text-[11px] uppercase tracking-[0.2em]', t.sub)}>{slide.eyebrow}</p>
                <h2 className={cn('mt-2.5 font-serif text-2xl leading-[1.1] [text-wrap:pretty] md:text-[42px] xl2:text-[54px]', t.title)}>
                  {slide.title}
                </h2>
                <p className={cn('mt-3 hidden max-w-[380px] text-[15px] leading-relaxed md:block', t.sub)}>{slide.body}</p>
                <Link
                  href={slide.href}
                  tabIndex={active ? 0 : -1}
                  className={cn('mt-3.5 inline-flex h-10 items-center rounded-full px-[22px] text-[11px] font-medium uppercase tracking-[0.16em] md:mt-5 md:h-[46px]', t.btn)}
                >
                  {slide.cta}
                </Link>
              </div>
              <div className="order-first min-h-0 overflow-hidden md:order-last">
                <img
                  src={slide.image}
                  alt={slide.title}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  // React 18 only passes the lowercase attribute through to the DOM.
                  {...(i === 0 ? { fetchpriority: 'high' } : {})}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: slide.imagePosition || '50% 50%' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.92] text-stone-900 md:flex"
          >
            <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/[0.92] text-stone-900 md:flex"
          >
            <ChevronRight className="h-[18px] w-[18px]" strokeWidth={1.5} />
          </button>
          <div className="absolute inset-x-0 bottom-3.5 flex justify-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.title}
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index}
                className={cn('h-2 rounded-full transition-all duration-300', i === index ? cn('w-6', tone.dot) : cn('w-2', tone.dotIdle))}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
