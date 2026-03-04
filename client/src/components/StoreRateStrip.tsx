import React, { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import { getStoreRates } from '@/data/rate-loader';
import { StoreRate } from '@/types/rates';

function formatDate(value: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getRateTone(rateKey: string) {
  if (rateKey.includes('silver')) {
    return {
      shell: 'bg-white',
      glow: 'bg-stone-200/80',
      accent: 'bg-stone-900',
      text: 'text-stone-500',
    };
  }

  return {
    shell: 'bg-[#f7f0de]',
    glow: 'bg-[#efe4ca]/80',
    accent: 'bg-[#8b6b1f]',
    text: 'text-stone-600',
  };
}

interface StoreRateStripProps {
  focusRateKey?: string;
  compact?: boolean;
  showPageLink?: boolean;
}

export default function StoreRateStrip({ focusRateKey, compact = false, showPageLink = !compact }: StoreRateStripProps) {
  const [rates, setRates] = useState<StoreRate[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getStoreRates()
      .then(payload => {
        if (cancelled) return;
        setRates(payload.rates || []);
        setUpdatedAt(payload.updatedAt);
        setReady(true);
      })
      .catch(error => {
        console.error('Failed to load store rates:', error);
        if (!cancelled) {
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleRates = useMemo(() => {
    const activeRates = rates.filter(rate => rate.isActive);

    if (focusRateKey) {
      return activeRates.filter(rate => rate.rateKey === focusRateKey);
    }

    return compact ? activeRates.slice(0, 2) : activeRates;
  }, [compact, focusRateKey, rates]);

  if (!ready || visibleRates.length === 0) {
    return null;
  }

  if (compact) {
    const rate = visibleRates[0];
    const formattedDate = formatDate(rate.updatedAt || updatedAt);
    const tone = getRateTone(rate.rateKey);

    return (
      <div className={`relative mt-4 overflow-hidden rounded-[28px] border border-stone-200 px-5 py-5 text-sm text-stone-700 shadow-[0_18px_50px_rgba(28,25,23,0.06)] ${tone.shell}`}>
        <div className={`absolute right-0 top-0 h-24 w-24 rounded-full blur-2xl ${tone.glow}`} aria-hidden="true" />
        <div className="relative flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-stone-400">
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
          Store rate card
        </div>
        <div className="relative mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${tone.accent}`} />
              <p className={`text-sm ${tone.text}`}>{rate.label}</p>
            </div>
            <p className="mt-2 font-serif text-[28px] font-light leading-none text-stone-900">
              {rate.currency} {rate.pricePerGram.toLocaleString()} / {rate.unit}
            </p>
          </div>
          {formattedDate && (
            <p className="text-xs uppercase tracking-[0.14em] text-stone-400">Updated {formattedDate}</p>
          )}
        </div>
      </div>
    );
  }

  const formattedDate = formatDate(updatedAt);

  return (
    <section className="relative overflow-hidden border-b border-stone-200 bg-[linear-gradient(135deg,#f5efe5_0%,#fbf8f3_55%,#ffffff_100%)]">
      <div className="absolute left-0 top-0 h-28 w-28 rounded-full bg-[#efe4ca]/70 blur-3xl" aria-hidden="true" />
      <div className="container relative py-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-stone-400">Store Rate API</p>
            <h2 className="mt-2 font-serif text-2xl font-light text-stone-950">Today&apos;s in-store metal rates</h2>
            <p className="mt-2 text-sm text-stone-500">
              These are the current Aashish Jewellers store rates used for market-linked pricing.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            {formattedDate && (
              <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Updated {formattedDate}</p>
            )}
            {showPageLink && (
              <Link
                href="/rates"
                className="inline-flex items-center border border-stone-300 px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-stone-700 transition-colors hover:border-stone-900"
              >
                View full rate page
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleRates.map(rate => (
            <div key={rate.rateKey} className={`relative overflow-hidden border border-stone-200 px-5 py-4 shadow-[0_16px_40px_rgba(28,25,23,0.04)] ${getRateTone(rate.rateKey).shell}`}>
              <div className={`absolute right-0 top-0 h-20 w-20 rounded-full blur-2xl ${getRateTone(rate.rateKey).glow}`} aria-hidden="true" />
              <p className="relative text-[11px] uppercase tracking-[0.18em] text-stone-400">{rate.label}</p>
              <p className="relative mt-2 font-serif text-3xl font-light text-stone-900">
                {rate.currency} {rate.pricePerGram.toLocaleString()}
              </p>
              <div className="relative mt-2 flex items-center justify-between gap-3">
                <p className="text-sm text-stone-500">per {rate.unit}</p>
                <span className={`h-2.5 w-2.5 rounded-full ${getRateTone(rate.rateKey).accent}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
