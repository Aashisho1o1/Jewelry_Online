import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { useFlashSale } from '@/contexts/FlashSaleContext';

interface TimeLeft {
  total: number;
  h: number;
  m: number;
  s: number;
}

function calcTimeLeft(endsAt: string): TimeLeft {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (diff <= 0) return { total: 0, h: 0, m: 0, s: 0 };
  return {
    total: diff,
    h: Math.floor(diff / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function Countdown({ endsAt }: { endsAt: string }) {
  const [t, setT] = useState<TimeLeft>(() => calcTimeLeft(endsAt));

  useEffect(() => {
    const id = setInterval(() => setT(calcTimeLeft(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (t.total <= 0) return null;

  return (
    <span className="inline-flex items-center gap-1 font-mono text-sm font-medium tabular-nums">
      {t.h > 0 && <><span>{pad(t.h)}</span><span className="opacity-60">:</span></>}
      <span>{pad(t.m)}</span>
      <span className="opacity-60">:</span>
      <span>{pad(t.s)}</span>
    </span>
  );
}

export default function FlashSaleBanner() {
  const { sale } = useFlashSale();
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!sale) return;
    // Watch for expiry to hide banner without needing a re-fetch
    const diff = new Date(sale.ends_at).getTime() - Date.now();
    if (diff <= 0) { setExpired(true); return; }
    const timer = setTimeout(() => setExpired(true), diff);
    return () => clearTimeout(timer);
  }, [sale]);

  if (!sale || expired) return null;

  function scrollToCatalog() {
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="w-full bg-stone-900 text-white">
      <div className="container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2.5">
        {/* Left — label + title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="inline-flex items-center gap-1 shrink-0 bg-amber-500 text-white text-[10px] font-semibold tracking-[0.14em] uppercase px-2 py-0.5">
            <Zap className="w-2.5 h-2.5" strokeWidth={2.5} />
            Flash Sale
          </span>
          <span className="text-sm font-light truncate">
            {sale.title}
            {sale.subtitle && (
              <span className="text-stone-400 ml-1.5">— {sale.subtitle}</span>
            )}
          </span>
          <span className="hidden sm:inline-block text-amber-400 font-medium text-sm shrink-0">
            {sale.discount_percent}% off everything
          </span>
        </div>

        {/* Right — countdown + CTA */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2 text-stone-300 text-xs">
            <span className="uppercase tracking-[0.14em]">Ends in</span>
            <Countdown endsAt={sale.ends_at} />
          </div>
          <button
            onClick={scrollToCatalog}
            className="text-xs tracking-[0.14em] uppercase text-amber-400 hover:text-amber-300 transition-colors font-medium"
          >
            Shop Now →
          </button>
        </div>
      </div>
    </div>
  );
}
