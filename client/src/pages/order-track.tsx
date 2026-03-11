import React, { useEffect, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { CheckCircle, Circle, MessageCircle, Package, Search, Truck, XCircle } from 'lucide-react';
import SiteMeta from '@/components/SiteMeta';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface TrackedOrder {
  id: string;
  status: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  createdAt: string;
}

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
] as const;

function statusToStep(status: string): number {
  const index = STATUS_STEPS.findIndex(s => s.key === status);
  return index >= 0 ? index : 0;
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Cash on Delivery',
  whatsapp: 'WhatsApp Order',
  esewa: 'eSewa',
  khalti: 'Khalti',
  fonepay: 'FonePay',
};

function Timeline({ status }: { status: string }) {
  const cancelled = status === 'cancelled' || status === 'refunded' || status === 'failed';
  const currentStep = statusToStep(status);

  if (cancelled) {
    return (
      <div className="flex items-center gap-3 border border-red-200 bg-red-50 px-5 py-4">
        <XCircle className="w-5 h-5 text-red-600 shrink-0" strokeWidth={1.5} />
        <p className="text-sm text-red-700 tracking-[0.12em] uppercase font-medium">
          Order {status}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <div className="flex items-start min-w-[560px] gap-0">
        {STATUS_STEPS.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          const future = index > currentStep;
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? 'bg-stone-900 border-stone-900 text-white'
                    : active
                    ? 'border-stone-900 bg-white animate-pulse'
                    : 'border-stone-300 bg-white'
                }`}>
                  {done ? (
                    <CheckCircle className="w-4 h-4" strokeWidth={2} />
                  ) : (
                    <Circle className={`w-3 h-3 ${active ? 'text-stone-900 fill-current' : 'text-stone-300'}`} strokeWidth={2} />
                  )}
                </div>
                <span className={`text-[11px] tracking-[0.1em] uppercase text-center leading-tight ${
                  future ? 'text-stone-400' : 'text-stone-800'
                }`}>
                  {step.label}
                </span>
              </div>
              {index < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-px mt-4 transition-colors ${done ? 'bg-stone-900' : 'bg-stone-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderTrack() {
  const [, params] = useRoute('/orders/:id');
  const urlId = params?.id || '';
  const urlPhone = new URLSearchParams(window.location.search).get('phone') || '';

  const [inputId, setInputId] = useState(urlId);
  const [searchId, setSearchId] = useState(urlId);
  const [inputPhone, setInputPhone] = useState(urlPhone);
  const [searchPhone, setSearchPhone] = useState(urlPhone);
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(urlId && urlPhone));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!searchId || !searchPhone) return;

    let cancelled = false;
    setLoading(true);
    setError('');
    setOrder(null);

    fetch(`/api/orders/lookup?id=${encodeURIComponent(searchId)}&phone=${encodeURIComponent(searchPhone)}`)
      .then(async r => {
        const data = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setError(data.error || 'Order not found. Please check the ID and try again.');
        } else {
          setOrder(data);
        }
      })
      .catch(() => {
        if (!cancelled) setError('Network error. Please check your connection.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [searchId, searchPhone]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputId.trim();
    const trimmedPhone = inputPhone.trim();
    if (!trimmed) {
      setError('Please enter your order ID.');
      return;
    }
    if (trimmedPhone.length < 7) {
      setError('Please enter the phone number you used at checkout.');
      return;
    }
    setSearchId(trimmed);
    setSearchPhone(trimmedPhone);
  };

  return (
    <div className="min-h-screen bg-[#f7f2ea] pt-24">
      <SiteMeta title="Track Your Order" noindex={true} />
      <div className="container py-12 max-w-3xl">
        <p className="text-xs tracking-[0.22em] uppercase text-stone-500 mb-4">Order Status</p>
        <h1 className="text-4xl md:text-5xl font-serif font-light text-stone-900">Track your order</h1>
        <p className="text-stone-600 leading-relaxed mt-4">
          Enter your order ID and the phone number you used at checkout to check its status.
        </p>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={inputId}
            onChange={e => setInputId(e.target.value)}
            placeholder="e.g. ORD-1234567890-abc"
            className="flex-1 border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-900 transition-colors tracking-[0.05em] font-mono"
          />
          <input
            type="tel"
            value={inputPhone}
            onChange={e => setInputPhone(e.target.value)}
            placeholder="Checkout phone number"
            className="flex-1 border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 focus:outline-none focus:border-stone-900 transition-colors"
          />
          <button
            type="submit"
            className="bg-stone-900 text-white px-6 py-3 text-sm tracking-[0.18em] uppercase hover:bg-stone-700 transition-colors flex items-center gap-2 shrink-0"
          >
            <Search className="w-4 h-4" strokeWidth={1.5} />
            Track
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="mt-12 flex flex-col items-center py-16 gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-stone-900" />
            <p className="text-stone-500 text-sm tracking-[0.15em] uppercase">Looking up your order...</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-10 border border-stone-200 bg-white px-6 py-10 text-center">
            <Package className="w-10 h-10 mx-auto text-stone-400 mb-4" strokeWidth={1.5} />
            <p className="text-stone-800 font-medium mb-2">We couldn&apos;t find that order</p>
            <p className="text-stone-500 text-sm">{error}</p>
            <a
              href="https://wa.me/9779811469486"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-6 border border-stone-300 px-5 py-3 text-sm tracking-[0.15em] uppercase text-stone-700 hover:border-stone-900 transition-colors"
            >
              <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
              Get help on WhatsApp
            </a>
          </div>
        )}

        {/* Order found */}
        {!loading && order && (
          <div className="mt-10 space-y-6">
            {/* Header */}
            <div className="bg-white border border-stone-200 px-6 py-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.18em] uppercase text-stone-500 mb-1">Order ID</p>
                <p className="font-mono text-stone-900 text-sm">{order.id}</p>
                <p className="text-xs text-stone-400 mt-1">
                  Placed {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <a
                href={`https://wa.me/9779811469486?text=${encodeURIComponent(`Hi, I need help with my order ${order.id}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-stone-300 px-4 py-2.5 text-sm tracking-[0.12em] uppercase text-stone-700 hover:border-stone-900 transition-colors"
              >
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                Need help?
              </a>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-stone-200 px-6 py-8">
              <p className="text-xs tracking-[0.18em] uppercase text-stone-500 mb-6">Delivery Progress</p>
              <Timeline status={order.status} />
            </div>

            {/* Order items */}
            <div className="bg-white border border-stone-200 px-6 py-6">
              <p className="text-xs tracking-[0.18em] uppercase text-stone-500 mb-5">Items Ordered</p>
              <div className="divide-y divide-stone-100">
                {order.items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="w-16 h-16 border border-stone-200 overflow-hidden shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-800 font-light leading-tight">{item.name}</p>
                      <p className="text-xs text-stone-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-stone-800 font-light shrink-0">NPR {(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-200 mt-4 pt-4 flex justify-between items-center">
                <span className="text-sm tracking-[0.12em] uppercase text-stone-500">Total</span>
                <span className="text-lg font-light text-stone-900">NPR {order.total.toLocaleString()}</span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
                <span className="text-xs text-stone-500">
                  Payment: {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                </span>
              </div>
            </div>

            <div className="text-center pt-4">
              <Link href="/" className="text-xs tracking-[0.18em] uppercase text-stone-600 underline underline-offset-4 hover:text-stone-900">
                Continue Shopping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
