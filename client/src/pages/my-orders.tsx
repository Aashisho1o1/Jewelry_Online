import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Package, ChevronRight, Search } from 'lucide-react';
import SiteMeta from '@/components/SiteMeta';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface Order {
  id: string;
  total: number;
  status: string;
  payment_method: string;
  items: OrderItem[];
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending:    'text-stone-500 bg-stone-100',
  confirmed:  'text-emerald-700 bg-emerald-50',
  processing: 'text-blue-700 bg-blue-50',
  dispatched: 'text-blue-700 bg-blue-50',
  delivered:  'text-stone-900 bg-stone-200',
};

const STATUS_LABELS: Record<string, string> = {
  pending:    'Pending',
  confirmed:  'Confirmed',
  processing: 'Processing',
  dispatched: 'Dispatched',
  delivered:  'Delivered',
};

const PAYMENT_LABELS: Record<string, string> = {
  esewa: 'eSewa', khalti: 'Khalti', fonepay: 'FonePay',
  whatsapp: 'WhatsApp Order', cod: 'Cash on Delivery',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NP', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function MyOrders() {
  const [, params] = useLocation();
  const urlParams = new URLSearchParams(window.location.search);
  const prefillPhone = urlParams.get('phone') || '';

  const [phone, setPhone] = useState(prefillPhone);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (prefillPhone && prefillPhone.length >= 7) {
      fetchOrders(prefillPhone);
    }
  }, []);

  async function fetchOrders(phoneValue: string) {
    setLoading(true);
    setError('');
    setSearched(false);
    try {
      const res = await fetch(`/api/orders/history?phone=${encodeURIComponent(phoneValue.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load orders');
      setOrders(data.orders || []);
      setSearched(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.trim().length < 7) {
      setError('Please enter a valid phone number.');
      return;
    }
    fetchOrders(phone.trim());
  }

  return (
    <div className="min-h-screen bg-[#f7f2ea]">
      <SiteMeta title="My Orders" noindex={true} />

      <div className="container py-12 md:py-16">
        <div className="max-w-2xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <p className="text-[10px] uppercase tracking-[0.22em] text-stone-400 mb-2">Account</p>
            <h1 className="font-serif text-3xl font-light text-stone-900">My Orders</h1>
            <p className="mt-2 text-sm text-stone-500">
              Enter the phone number you used at checkout to view your order history.
            </p>
          </div>

          {/* Phone lookup form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 9841234567"
                className="flex-1 border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-stone-900 px-5 py-3 text-xs uppercase tracking-[0.18em] text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
              >
                <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
                {loading ? 'Looking up...' : 'Find orders'}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-600">{error}</p>
            )}
          </form>

          {/* Results */}
          {searched && orders.length === 0 && (
            <div className="border border-stone-200 bg-white px-6 py-12 text-center">
              <Package className="mx-auto mb-4 h-8 w-8 text-stone-300" strokeWidth={1} />
              <p className="font-serif text-lg font-light text-stone-900">No orders found</p>
              <p className="mt-1 text-sm text-stone-400">
                No orders were found for this phone number.
              </p>
            </div>
          )}

          {orders.length > 0 && (
            <div className="space-y-3">
              {orders.map(order => {
                const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
                const firstImage = order.items?.[0]?.image;
                const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
                const statusLabel = STATUS_LABELS[order.status] || order.status;

                return (
                  <Link key={order.id} href={`/orders/${order.id}`}>
                    <div className="flex items-center gap-4 border border-stone-200 bg-white px-5 py-4 transition-colors hover:border-stone-400 cursor-pointer">
                      {/* Thumbnail */}
                      <div className="h-14 w-14 shrink-0 overflow-hidden bg-[#f0ebe3]">
                        {firstImage && (
                          <img
                            src={firstImage}
                            alt=""
                            className="h-full w-full object-cover"
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-mono text-xs text-stone-500">{order.id}</p>
                          <span className={`shrink-0 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] ${statusStyle}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-stone-900">
                          NPR {order.total.toLocaleString()}
                        </p>
                        <p className="mt-0.5 text-[11px] text-stone-400">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'} &middot; {formatDate(order.created_at)} &middot; {PAYMENT_LABELS[order.payment_method] || order.payment_method}
                        </p>
                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" strokeWidth={1.5} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer nav */}
          <div className="mt-10 flex gap-4 text-xs text-stone-400">
            <Link href="/" className="hover:text-stone-900 transition-colors">
              Continue shopping
            </Link>
            <span>&middot;</span>
            <a
              href="https://wa.me/9779811469486"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-900 transition-colors"
            >
              Need help? WhatsApp us
            </a>
          </div>

        </div>
      </div>
    </div>
  );
}
