import React from 'react';
import { Sparkles, ShieldCheck, Droplets } from 'lucide-react';
import SiteMeta from '@/components/SiteMeta';

const CARE_STEPS = [
  {
    icon: Sparkles,
    title: 'Daily care',
    text: 'Wipe jewelry gently with a soft dry cloth after wearing it so oils, sweat and dust do not settle into the finish.',
  },
  {
    icon: ShieldCheck,
    title: 'Safe storage',
    text: 'Store each piece separately in a pouch or lined box to reduce scratching, tangling and tarnish from air exposure.',
  },
  {
    icon: Droplets,
    title: 'Avoid moisture & chemicals',
    text: 'Remove jewelry before showers, swimming, gym sessions, perfume, lotions and harsh cleaning products.',
  },
];

export default function CareGuidePage() {
  return (
    <div className="min-h-screen bg-[#f7f2ea] pt-24">
      <SiteMeta
        title="Silver Jewelry Care Guide"
        description="Learn how to clean, store and protect your 925 silver and plated jewelry to keep it looking beautiful for years."
      />
      <div className="container py-12">
        <div className="max-w-3xl">
          <p className="text-xs tracking-[0.22em] uppercase text-stone-500 mb-4">Aftercare</p>
          <h1 className="text-4xl md:text-5xl font-serif font-light text-stone-900">Jewelry care guide</h1>
          <p className="text-stone-600 leading-relaxed mt-5">
            Use this page as the default maintenance guide for silver and plated jewelry until you add material-specific instructions per product.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {CARE_STEPS.map(step => (
            <div key={step.title} className="bg-white border border-stone-200 px-6 py-6">
              <step.icon className="w-6 h-6 text-stone-700 mb-4" strokeWidth={1.5} />
              <h2 className="text-xl font-serif font-light text-stone-900">{step.title}</h2>
              <p className="text-stone-600 leading-relaxed mt-4">{step.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-stone-900 text-white px-8 py-8 max-w-4xl">
          <p className="text-xs tracking-[0.2em] uppercase text-white/60 mb-3">Cleaning checklist</p>
          <div className="grid gap-3 text-white/80 leading-relaxed">
            <p>1. Use a microfiber or silver-polishing cloth first.</p>
            <p>2. Clean only when needed. Over-cleaning plated pieces can reduce finish life.</p>
            <p>3. Let jewelry dry fully before storing it again.</p>
            <p>4. For loose stones, clasp issues or re-plating, direct the customer to WhatsApp or store support instead of suggesting home repair.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
