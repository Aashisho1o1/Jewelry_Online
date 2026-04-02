import React from 'react';
import { Ruler, Hand } from 'lucide-react';
import SiteMeta from '@/components/SiteMeta';

const RING_SIZES = [
  { size: '6', diameter: '16.5 mm', note: 'Slim fingers / snug fit' },
  { size: '7', diameter: '17.3 mm', note: 'Common regular fit' },
  { size: '8', diameter: '18.1 mm', note: 'Comfortable medium-large fit' },
  { size: '9', diameter: '19.0 mm', note: 'Statement or larger fit' },
];

export default function SizeGuidePage() {
  return (
    <div className="min-h-screen bg-[#f7f2ea] pt-24">
      <SiteMeta
        title="Ring Size Guide"
        description="Find your perfect ring size with our easy measurement guide. Includes size chart for Indian, US and UK ring sizes."
      />
      <div className="container py-12">
        <div className="max-w-3xl">
          <p className="text-xs tracking-[0.22em] uppercase text-stone-500 mb-4">Fit Help</p>
          <h1 className="text-4xl md:text-5xl font-serif font-light text-stone-900">Ring size guide</h1>
          <p className="text-stone-600 leading-relaxed mt-5">
            Start with a simple reference chart, then expand this into a printable ring sizer or on-screen measurement tool later.
          </p>
        </div>

        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8 mt-12">
          <div className="bg-stone-900 text-white px-8 py-8">
            <Ruler className="w-6 h-6 mb-4" strokeWidth={1.5} />
            <p className="text-xs tracking-[0.18em] uppercase text-white/60 mb-3">How to measure</p>
            <div className="grid gap-3 text-white/80 leading-relaxed">
              <p>1. Wrap a thin strip of paper around the finger you want to wear the ring on.</p>
              <p>2. Mark where the paper overlaps, then measure that length.</p>
              <p>3. Compare the result with your preferred ring size reference in-store.</p>
              <p>4. If you are between sizes, choose the slightly larger option for comfort.</p>
            </div>
          </div>

          <div className="bg-white border border-stone-200 px-6 py-6">
            <div className="flex items-center gap-3 mb-6">
              <Hand className="w-5 h-5 text-stone-700" strokeWidth={1.5} />
              <p className="text-xs tracking-[0.18em] uppercase text-stone-500">Reference sizes</p>
            </div>
            <div className="grid gap-3">
              {RING_SIZES.map(row => (
                <div key={row.size} className="grid sm:grid-cols-3 gap-3 border border-stone-200 px-4 py-4">
                  <p className="text-stone-900 font-medium">Size {row.size}</p>
                  <p className="text-stone-600">{row.diameter}</p>
                  <p className="text-stone-600">{row.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
