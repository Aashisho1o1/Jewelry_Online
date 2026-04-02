import { RotateCcw, Shield, Truck } from 'lucide-react';

const TRUST_ITEMS = [
  {
    title: 'Certified silver',
    icon: Shield,
  },
  {
    title: 'Easy returns',
    icon: RotateCcw,
  },
  {
    title: 'Delivery across Nepal',
    icon: Truck,
  },
];

export default function TrustStrip() {
  return (
    <section className="border-b border-stone-200 bg-white">
      <div className="container py-4">
        <div className="grid gap-3 sm:grid-cols-3">
          {TRUST_ITEMS.map(item => (
            <div key={item.title} className="flex items-center justify-center gap-2.5 text-sm text-stone-600 sm:justify-start">
              <item.icon className="h-4 w-4 text-stone-900" strokeWidth={1.5} />
              <span className="uppercase tracking-[0.14em]">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
