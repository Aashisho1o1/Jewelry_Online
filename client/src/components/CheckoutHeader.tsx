import { Lock } from 'lucide-react';
import { Link } from 'wouter';

// Checkout drops the shop menu and footer so the only way forward is finishing the order.
export default function CheckoutHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex h-[68px] max-w-[1120px] items-center justify-between px-4 md:px-10">
        <Link href="/" className="flex flex-col" aria-label="Aashish Jewellers home">
          <span className="font-serif text-lg leading-[1.1] tracking-[0.2em] text-stone-900">AASHISH</span>
          <span className="text-[8px] tracking-[0.28em] text-stone-500">JEWELLERS</span>
        </Link>
        <span className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-forest-900">
          <Lock className="h-4 w-4" strokeWidth={1.5} />
          Secure checkout
        </span>
      </div>
    </header>
  );
}
