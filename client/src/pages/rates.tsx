import React, { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import SiteMeta from '@/components/SiteMeta';
import { getStoreRates } from '@/data/rate-loader';
import { StoreRatesResponse } from '@/types/rates';

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
      accent: 'bg-stone-900',
      meta: 'text-stone-500',
    };
  }

  return {
    shell: 'bg-[#f7f0de]',
    accent: 'bg-[#8b6b1f]',
    meta: 'text-stone-600',
  };
}

export default function RatesPage() {
  const [payload, setPayload] = useState<StoreRatesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    getStoreRates(true)
      .then(data => {
        if (!cancelled) {
          setPayload(data);
        }
      })
      .catch(error => {
        console.error('Failed to load public store rates:', error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const updatedLabel = formatDate(payload?.updatedAt || null);
  const activeRates = payload?.rates?.filter(rate => rate.isActive) || [];
  const featuredRates = (activeRates.length > 0 ? activeRates : payload?.rates || []).slice(0, 2);
  const statusLabel = activeRates.length > 0 ? 'Live store rate' : 'Awaiting update';

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <SiteMeta
        title="Gold & Silver Rate | Aashish Jewellers"
        description="View Aashish Jewellers current gold and silver store rates used for market-linked pricing."
        canonical="/rates"
      />

      <section className="relative overflow-hidden border-b border-stone-200 bg-[linear-gradient(135deg,#fbf8f3_0%,#ffffff_45%,#f4efe7_100%)]">
        <div className="absolute left-0 top-0 h-48 w-48 rounded-full bg-[#efe4ca]/60 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-stone-200/60 blur-3xl" aria-hidden="true" />

        <div className="container relative py-10 md:py-20">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:gap-8">
            <div className="max-w-3xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-400">Store Rate Card</p>
              <h1 className="mt-4 font-serif text-[2.85rem] font-light leading-[0.98] text-stone-950 md:text-6xl md:leading-tight">
                Gold and silver rates presented like part of the brand, not a backend tool.
              </h1>
              <p className="mt-4 max-w-2xl text-base font-light leading-relaxed text-stone-500 md:text-lg">
                Customers can check the current Aashish Jewellers store rate first, then review market-linked product pricing with more confidence.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 border border-stone-300 bg-white/80 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-stone-700 md:px-4 md:text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {statusLabel}
                </span>
                <span className="inline-flex items-center gap-2 border border-stone-300 bg-white/80 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-stone-700 md:px-4 md:text-[11px]">
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {updatedLabel ? `Updated ${updatedLabel}` : 'Waiting for today\'s rate update'}
                </span>
                <span className="inline-flex items-center gap-2 border border-stone-300 bg-white/80 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-stone-700 md:px-4 md:text-[11px]">
                  Endpoint: `/api/rates`
                </span>
              </div>
            </div>

            <div className="border border-stone-200 bg-white/90 p-4 shadow-[0_24px_60px_rgba(28,25,23,0.08)] backdrop-blur-sm md:p-8">
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Today&apos;s desk card</p>
              <div className="mt-4 space-y-4">
                {featuredRates.length > 0 ? (
                  featuredRates.map(rate => {
                    const tone = getRateTone(rate.rateKey);

                    return (
                      <div key={rate.rateKey} className={`border border-stone-200 px-4 py-4 md:px-5 ${tone.shell}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.16em] text-stone-400">{rate.label}</p>
                            {rate.isActive ? (
                              <>
                                <p className="mt-2 font-serif text-3xl font-light text-stone-950">
                                  {rate.currency} {rate.pricePerGram.toLocaleString()}
                                </p>
                                <p className={`mt-1 text-sm ${tone.meta}`}>per {rate.unit}</p>
                              </>
                            ) : (
                              <>
                                <p className="mt-2 text-lg font-light text-stone-900">Awaiting today&apos;s update</p>
                                <p className={`mt-1 text-sm ${tone.meta}`}>Set the current rate from the admin dashboard.</p>
                              </>
                            )}
                          </div>
                          <span className={`mt-1 h-3 w-3 rounded-full ${tone.accent}`} />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="border border-dashed border-stone-300 bg-[#faf8f5] px-5 py-6">
                    <p className="text-sm text-stone-600">
                      Today&apos;s public store rates will appear here after the first admin update.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="container">
          <div className="border border-stone-200 bg-white p-5 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Rate Board</p>
                <h2 className="mt-3 font-serif text-3xl font-light text-stone-950">Current Aashish Jewellers store rates</h2>
              </div>
              {updatedLabel && (
                <p className="text-xs uppercase tracking-[0.16em] text-stone-400">Last refreshed {updatedLabel}</p>
              )}
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-stone-500">Loading current store rates.</p>
            ) : payload?.rates?.length ? (
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {payload.rates.map(rate => (
                  <article
                    key={rate.rateKey}
                    className={`relative h-full overflow-hidden border border-stone-200 p-4 md:p-5 ${getRateTone(rate.rateKey).shell}`}
                  >
                    <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-white/60 blur-2xl" aria-hidden="true" />
                    <p className="relative text-[11px] uppercase tracking-[0.16em] text-stone-400">{rate.label}</p>
                    {rate.isActive ? (
                      <>
                        <p className="relative mt-3 font-serif text-3xl font-light text-stone-950">
                          {rate.currency} {rate.pricePerGram.toLocaleString()}
                        </p>
                        <div className="relative mt-3 flex items-center justify-between gap-3">
                          <p className="text-sm text-stone-500">per {rate.unit}</p>
                          <span className="text-[11px] uppercase tracking-[0.14em] text-stone-400">{rate.sourceLabel}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="relative mt-3 text-lg font-light text-stone-900">Awaiting update</p>
                        <div className="relative mt-3 flex items-center justify-between gap-3">
                          <p className="text-sm text-stone-500">This rate is configured but not published yet.</p>
                        </div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-stone-500">
                No public rates are active yet. Add today&apos;s values from the Metal Rates admin tab.
              </p>
            )}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr]">
            <div className="border border-stone-200 bg-white p-6 md:p-8">
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">How pricing works</p>
              <h2 className="mt-3 font-serif text-3xl font-light text-stone-950">Simple, visible, and consistent</h2>
              <div className="mt-8 grid gap-4">
                {[
                  {
                    number: '01',
                    title: 'The store updates its own metal rate',
                    text: 'Silver and gold values are set from the Aashish Jewellers side, so the page reflects your own pricing desk.',
                  },
                  {
                    number: '02',
                    title: 'Market-linked products adjust from a baseline',
                    text: 'The stored product price remains the baseline. The current rate changes only the metal-linked adjustment.',
                  },
                  {
                    number: '03',
                    title: 'Checkout refreshes before order confirmation',
                    text: 'Customers see the same latest price that the server uses when the order is actually placed.',
                  },
                ].map(item => (
                  <div key={item.number} className="grid gap-3 border-t border-stone-200 pt-4 sm:grid-cols-[64px_1fr] sm:items-start">
                    <span className="font-serif text-2xl font-light text-stone-300">{item.number}</span>
                    <div>
                      <h3 className="text-lg font-light text-stone-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-stone-600">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-stone-200 bg-[#f4efe7] p-6 md:p-8">
              <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Customer trust</p>
              <h2 className="mt-3 font-serif text-3xl font-light text-stone-950">Why this feels better for buying</h2>
              <div className="mt-6 grid gap-4">
                {[
                  'Customers can check the rate before checking a linked product price.',
                  'The page is owned by the store, not embedded from a third-party finance widget.',
                  'Silver and gold pricing reads like part of the brand experience instead of a hidden backend rule.',
                ].map(point => (
                  <div key={point} className="flex gap-3 border-t border-stone-300/60 pt-4 text-sm leading-7 text-stone-600 first:border-t-0 first:pt-0">
                    <Sparkles className="mt-1 h-4 w-4 shrink-0 text-stone-900" strokeWidth={1.5} />
                    <p>{point}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[28px] border border-stone-300/70 bg-white/70 p-5 md:p-6">
                <p className="text-[11px] uppercase tracking-[0.18em] text-stone-400">Next step</p>
                <h3 className="mt-2 font-serif text-2xl font-light text-stone-950">Browse products that use the live rate system</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  The rate page builds confidence. The product page shows the actual linked selling price.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/shop-by"
                    className="inline-flex items-center gap-2 bg-stone-950 px-5 py-3 text-xs uppercase tracking-[0.16em] text-white transition-colors hover:bg-stone-800"
                  >
                    Browse products
                    <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center border border-stone-300 px-5 py-3 text-xs uppercase tracking-[0.16em] text-stone-800 transition-colors hover:border-stone-900"
                  >
                    Back to homepage
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
