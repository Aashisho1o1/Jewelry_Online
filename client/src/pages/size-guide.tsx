import React from 'react';
import { Ruler, Hand } from 'lucide-react';
import SiteMeta from '@/components/SiteMeta';
import { SIZE_CHOICES } from '@/lib/ring-sizes';

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-[#f7f2ea] pt-24">
      <SiteMeta
        title="Size Guide"
        description="Ring sizes, necklace chain lengths and bracelet sizes at Aashish Jewellers, with simple ways to measure at home."
      />
      <div className="container py-12">
        <div className="max-w-3xl">
          <p className="text-xs tracking-[0.22em] uppercase text-stone-500 mb-4">Fit Help</p>
          <h1 className="text-4xl md:text-5xl font-serif font-light text-stone-900">Size guide</h1>
          <p className="text-stone-600 leading-relaxed mt-5">
            Not sure? Choose "Not sure" when you order and we'll help you with the size when we call to confirm.
          </p>
        </div>

        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8 mt-12">
          <div className="bg-stone-900 text-white px-8 py-8">
            <Ruler className="w-6 h-6 mb-4" strokeWidth={1.5} />
            <p className="text-xs tracking-[0.18em] uppercase text-white/60 mb-3">How to measure</p>
            <div className="grid gap-3 text-white/80 leading-relaxed">
              <p>1. Wrap a thin strip of paper around the finger you want to wear the ring on.</p>
              <p>2. Mark where the paper overlaps, then measure that length.</p>
              <p>3. Compare it with the inside measurements in the ring chart.</p>
              <p>4. Necklace: hold a string where you want the pendant to sit, then measure it.</p>
              <p>5. Bracelet: measure your wrist and add about 1.5 cm for comfort.</p>
              <p>6. Between sizes? Choose the larger one.</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 px-6 py-6">
            <div className="flex items-center gap-3 mb-6">
              <Hand className="w-5 h-5 text-stone-700" strokeWidth={1.5} />
              <p className="text-xs tracking-[0.18em] uppercase text-stone-500">Reference sizes</p>
            </div>
            <div className="grid gap-6">
              {Object.values(SIZE_CHOICES).map(choice => (
                <section key={choice.title}>
                  <h2 className="mb-2 text-sm font-medium text-stone-900">{choice.title}</h2>
                  <div className="grid gap-2">
                    {choice.options.map(row => (
                      <div key={row.value} className="grid gap-1 border border-stone-200 px-4 py-3 sm:grid-cols-[5rem_1fr]">
                        <p className="font-medium text-stone-900">{row.label}</p>
                        <p className="text-stone-600">{row.note}</p>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
