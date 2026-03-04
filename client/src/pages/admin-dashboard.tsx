import React, { useCallback, useEffect, useState } from 'react';
import { BarChart2, ChevronDown, ChevronUp, Download, LogOut, MessageCircle, Package, Printer, RefreshCw, Search, Tag, Wrench, Zap } from 'lucide-react';
import SiteMeta from '@/components/SiteMeta';

// Types

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface AdminOrder {
  id: string;
  items: OrderItem[];
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: { street: string; district: string; zone?: string; landmark?: string };
  };
  total: number;
  payment_method: string;
  status: string;
  notes?: string | null;
  created_at: string;
}

interface DailyRevenue { day: string; orders: number; revenue: number; }
interface TopProduct { product_id: string; name: string; revenue: number; units: number; }

interface StatsData {
  byStatus: Record<string, { count: number; revenue: number }>;
  totalOrders: number;
  totalRevenue: number;
}

interface Promo {
  id: number;
  code: string;
  description: string | null;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

interface InventoryRow {
  product_id: string;
  quantity: number;
  updated_at: string;
}

interface MetalRateRow {
  rateKey: string;
  label: string;
  pricePerGram: number;
  baselinePricePerGram: number;
  source: string | null;
  notes: string | null;
  updatedAt: string | null;
}

interface AbandonedCart {
  id: string;
  name: string | null;
  phone: string | null;
  items: OrderItem[];
  subtotal: number;
  created_at: string;
  recovered: boolean;
}

interface DbProduct {
  id: string;
  name: string;
  category: string;
  material: string;
  price: number;
  original_price: number | null;
  description: string | null;
  care_instructions: string | null;
  weight: string | null;
  dimensions: string | null;
  in_stock: boolean;
  is_new: boolean;
  images: string[];
  tags: string[];
  price_source: string;
  created_at: string;
}

// Constants

const VALID_STATUSES = [
  'pending', 'confirmed', 'processing', 'dispatched', 'delivered',
  'cancelled', 'refunded', 'failed',
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-50 text-red-600',
};

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'COD', whatsapp: 'WhatsApp', esewa: 'eSewa', khalti: 'Khalti', fonepay: 'FonePay',
};

const FILTER_TABS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// Helpers

function formatNPR(amount: number) {
  return 'NPR ' + Math.round(amount).toLocaleString('en-IN');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function exportOrdersCSV(orders: AdminOrder[]) {
  const headers = ['Order ID','Customer','Phone','Address','Items','Total','Payment','Status','Date','Notes'];
  const rows = orders.map(o => [
    o.id,
    o.customer?.name || '',
    o.customer?.phone || '',
    [o.customer?.address?.street, o.customer?.address?.landmark, o.customer?.address?.district].filter(Boolean).join(', '),
    (o.items || []).map(i => `${i.name} x${i.quantity}`).join('; '),
    o.total,
    o.payment_method,
    o.status,
    new Date(o.created_at).toLocaleDateString(),
    o.notes || '',
  ]);
  const csv = [headers, ...rows].map(r =>
    r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

function printOrder(order: AdminOrder) {
  const w = window.open('', '_blank', 'width=620,height=900');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Order ${order.id}</title><style>
    body{font-family:monospace;padding:24px;font-size:13px;color:#111}
    h1{font-size:15px;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px}
    .row{display:flex;justify-content:space-between;margin:3px 0}
    .label{color:#555}hr{border:none;border-top:1px solid #ccc;margin:12px 0}
    table{width:100%;border-collapse:collapse;margin:8px 0}
    td,th{border:1px solid #ccc;padding:5px 8px;font-size:12px;text-align:left}
    th{background:#f5f5f5}.total{font-weight:bold;font-size:14px;margin-top:8px}
  </style></head><body>
  <h1>Aashish Jewellers — Order Slip</h1>
  <div class="row"><span class="label">Order ID</span><span>${order.id}</span></div>
  <div class="row"><span class="label">Date</span><span>${new Date(order.created_at).toLocaleString()}</span></div>
  <div class="row"><span class="label">Status</span><span>${order.status.toUpperCase()}</span></div>
  <div class="row"><span class="label">Payment</span><span>${order.payment_method}</span></div>
  <hr>
  <div class="row"><span class="label">Name</span><span>${order.customer?.name || '-'}</span></div>
  <div class="row"><span class="label">Phone</span><span>${order.customer?.phone || '-'}</span></div>
  <div class="row"><span class="label">Address</span><span>${[order.customer?.address?.street, order.customer?.address?.landmark, order.customer?.address?.district, order.customer?.address?.zone].filter(Boolean).join(', ')}</span></div>
  <hr>
  <table><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr>
  ${(order.items || []).map(i => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>NPR ${Number(i.price).toLocaleString()}</td><td>NPR ${(i.price * i.quantity).toLocaleString()}</td></tr>`).join('')}
  </table>
  <div class="total">Total: NPR ${Number(order.total).toLocaleString()}</div>
  ${order.notes ? `<hr><p><strong>Note:</strong> ${order.notes}</p>` : ''}
  <script>window.print();window.close();</script></body></html>`);
}

function RevenueChart({ days }: { days: DailyRevenue[] }) {
  if (!days.length) return (
    <div className="bg-white border border-stone-200 p-6 text-sm text-stone-400 text-center">No revenue data for the last 30 days.</div>
  );
  const maxRev = Math.max(...days.map(d => Number(d.revenue)), 1);
  return (
    <div className="bg-white border border-stone-200 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500 mb-4 flex items-center gap-2">
        <BarChart2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        Revenue — Last 30 Days
      </p>
      <div className="flex items-end gap-px h-24">
        {days.map(d => (
          <div
            key={d.day}
            className="flex-1 bg-stone-800 hover:bg-amber-500 transition-colors cursor-default"
            style={{ height: `${Math.max((Number(d.revenue) / maxRev) * 100, 2)}%` }}
            title={`${d.day}\nNPR ${Math.round(Number(d.revenue)).toLocaleString()} · ${d.orders} order(s)`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-stone-400">
        <span>{days[0]?.day?.slice(5)}</span>
        <span>{days[days.length - 1]?.day?.slice(5)}</span>
      </div>
    </div>
  );
}

function TopProductsWidget({ products }: { products: TopProduct[] }) {
  if (!products.length) return null;
  const maxRev = Math.max(...products.map(p => Number(p.revenue)), 1);
  return (
    <div className="bg-white border border-stone-200 p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500 mb-4">Top Products by Revenue</p>
      <div className="space-y-3">
        {products.map(p => (
          <div key={p.product_id}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-stone-800 truncate flex-1 pr-2">{p.name || p.product_id}</span>
              <span className="text-stone-400 shrink-0">{p.units} units · {formatNPR(Number(p.revenue))}</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-sm">
              <div className="h-full bg-stone-800 rounded-sm" style={{ width: `${(Number(p.revenue) / maxRev) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Sub-components

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-stone-200 px-6 py-5">
      <p className="text-xs tracking-[0.18em] uppercase text-stone-500 mb-2">{label}</p>
      <p className="text-3xl font-light text-stone-900">{value}</p>
      {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
    </div>
  );
}

function OrderRow({
  order,
  adminKey,
  onStatusChange,
}: {
  order: AdminOrder;
  adminKey: string;
  onStatusChange: (id: string, status: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [note, setNote] = useState(order.notes || '');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const handleSaveNote = async () => {
    setNoteSaving(true);
    setNoteSaved(false);
    try {
      await fetch('/api/orders/add-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ orderId: order.id, note }),
      });
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 3000);
    } finally {
      setNoteSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === order.status) return;
    setUpdating(true);
    setUpdateError('');
    setStatusMsg('');
    try {
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ orderId: order.id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        setUpdateError(data.error || 'Update failed');
      } else {
        onStatusChange(order.id, newStatus);
        setStatusMsg(data.whatsappSent ? 'WhatsApp sent' : 'Updated');
        setTimeout(() => setStatusMsg(''), 3000);
      }
    } catch {
      setUpdateError('Network error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <tr className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="font-mono text-xs text-stone-700 hover:text-stone-900 flex items-center gap-1"
          >
            {order.id.slice(0, 20)}...
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </td>
        <td className="px-4 py-3 text-sm text-stone-700">{order.customer?.name || '-'}</td>
        <td className="px-4 py-3 text-sm text-stone-700">{order.items?.length ?? 0} item(s)</td>
        <td className="px-4 py-3 text-sm font-light">{formatNPR(order.total)}</td>
        <td className="px-4 py-3 text-xs">{PAYMENT_LABELS[order.payment_method] || order.payment_method}</td>
        <td className="px-4 py-3">
          <select
            aria-label="Order status"
            value={order.status}
            onChange={e => handleStatusChange(e.target.value)}
            disabled={updating}
            className={`text-xs px-2 py-1 rounded-full border-0 font-medium focus:outline-none focus:ring-1 focus:ring-stone-900 ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-700'}`}
          >
            {VALID_STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          {updateError && <p className="text-red-600 text-[10px] mt-1">{updateError}</p>}
          {statusMsg && <p className="text-emerald-700 text-[10px] mt-1">{statusMsg}</p>}
        </td>
        <td className="px-4 py-3 text-xs text-stone-400">{formatDate(order.created_at)}</td>
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={() => printOrder(order)}
            title="Print order slip"
            className="text-stone-400 hover:text-stone-900 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-stone-100 bg-stone-50">
          <td colSpan={8} className="px-6 py-5">
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase text-stone-500 mb-3">Items</p>
                <div className="space-y-2">
                  {order.items?.map((item, i) => (
                    <div key={`${item.id}-${i}`} className="flex gap-3 items-center">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover border border-stone-200" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-stone-700 truncate">{item.name}</p>
                        <p className="text-xs text-stone-400">Qty {item.quantity} x NPR {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase text-stone-500 mb-3">Customer</p>
                <dl className="space-y-1 text-sm">
                  <div><dt className="inline text-stone-400">Name: </dt><dd className="inline text-stone-700">{order.customer?.name}</dd></div>
                  <div><dt className="inline text-stone-400">Phone: </dt><dd className="inline text-stone-700">{order.customer?.phone}</dd></div>
                  {order.customer?.email && (
                    <div><dt className="inline text-stone-400">Email: </dt><dd className="inline text-stone-700">{order.customer.email}</dd></div>
                  )}
                  <div className="pt-1">
                    <dt className="text-stone-400 text-xs tracking-[0.1em] uppercase mb-1">Address</dt>
                    <dd className="text-stone-700">{[
                      order.customer?.address?.street,
                      order.customer?.address?.landmark,
                      order.customer?.address?.district,
                      order.customer?.address?.zone,
                    ].filter(Boolean).join(', ')}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase text-stone-500 mb-2">Internal Note</p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Private note visible only to admin..."
                  className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900 resize-none h-20"
                />
                <button
                  type="button"
                  onClick={handleSaveNote}
                  disabled={noteSaving}
                  className="mt-2 bg-stone-900 text-white px-4 py-1.5 text-xs uppercase tracking-[0.15em] hover:bg-stone-700 transition-colors disabled:opacity-50"
                >
                  {noteSaving ? 'Saving...' : noteSaved ? '✓ Saved' : 'Save Note'}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// Lock screen

function LockScreen({ onAuth }: { onAuth: (key: string) => void }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders/stats', {
        headers: { 'x-admin-key': key.trim() },
      });
      if (res.ok) {
        onAuth(key.trim());
      } else {
        const data = await res.json();
        setError(data.error || 'Incorrect admin key. Please try again.');
      }
    } catch {
      setError('Network error. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
      <div className="bg-white w-full max-w-md px-8 py-10">
        <p className="text-xs tracking-[0.25em] uppercase text-stone-500 mb-3">Store Admin</p>
        <h1 className="text-3xl font-serif font-light text-stone-900 mb-8">Aashish Jewellers</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs tracking-[0.15em] uppercase text-stone-600 mb-2">Admin Key</label>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="Enter your admin key"
              autoComplete="current-password"
              className="w-full border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:border-stone-900 transition-colors"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-stone-900 text-white py-3 text-sm tracking-[0.18em] uppercase hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Promos tab

function PromosTab({ adminKey }: { adminKey: string }) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'percent', discountValue: '',
    minOrderAmount: '', maxUses: '', expiresAt: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/promos/list', { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      setPromos(data.promos || []);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  const handleDelete = async (p: Promo) => {
    if (!window.confirm(`Delete promo "${p.code}"? This cannot be undone.`)) return;
    try {
      await fetch('/api/promos/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ id: p.id }),
      });
      setPromos(prev => prev.filter(x => x.id !== p.id));
    } catch { alert('Delete failed.'); }
  };

  const handleToggle = async (p: Promo) => {
    try {
      const res = await fetch('/api/promos/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ id: p.id, active: !p.active }),
      });
      if (res.ok) setPromos(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x));
    } catch { /* silently fail */ }
  };

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const res = await fetch('/api/promos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          code: form.code,
          description: form.description || undefined,
          discountType: form.discountType,
          discountValue: parseFloat(form.discountValue),
          minOrderAmount: parseFloat(form.minOrderAmount) || 0,
          maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
          expiresAt: form.expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create promo.');
      } else {
        setShowForm(false);
        setForm({ code: '', description: '', discountType: 'percent', discountValue: '', minOrderAmount: '', maxUses: '', expiresAt: '' });
        load();
      }
    } catch {
      setFormError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-stone-500">{promos.length} promo code{promos.length !== 1 ? 's' : ''}</p>
        <button
          type="button"
          onClick={() => setShowForm(v => !v)}
          className="bg-stone-900 text-white px-5 py-2 text-xs tracking-[0.15em] uppercase hover:bg-stone-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ New Promo'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-stone-200 p-6 mb-6 space-y-4">
          <p className="text-xs tracking-[0.18em] uppercase text-stone-500 mb-2">New Promo Code</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-600 mb-1">Code *</label>
              <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="e.g. SAVE10" className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. 10% off everything" className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900" />
            </div>
            <div>
              <label htmlFor="discountType" className="block text-xs text-stone-600 mb-1">Discount Type *</label>
              <select id="discountType" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900">
                <option value="percent">Percent (%)</option>
                <option value="fixed">Fixed (NPR)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1">Discount Value *</label>
              <input required type="number" min="0.01" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                placeholder={form.discountType === 'percent' ? '10' : '200'} className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1">Min Order (NPR)</label>
              <input type="number" min="0" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                placeholder="0" className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900" />
            </div>
            <div>
              <label className="block text-xs text-stone-600 mb-1">Max Uses</label>
              <input type="number" min="1" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                placeholder="Unlimited" className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="expiresAt" className="block text-xs text-stone-600 mb-1">Expires At</label>
              <input id="expiresAt" type="datetime-local" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                className="w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900" />
            </div>
          </div>
          {formError && <p className="text-red-600 text-sm">{formError}</p>}
          <button type="submit" disabled={saving}
            className="bg-stone-900 text-white px-6 py-2 text-xs tracking-[0.15em] uppercase hover:bg-stone-700 disabled:opacity-50 transition-colors">
            {saving ? 'Creating...' : 'Create Promo'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Loading...</div>
      ) : promos.length === 0 ? (
        <div className="bg-white border border-stone-200 py-12 text-center text-stone-400 text-sm">No promo codes yet.</div>
      ) : (
        <div className="bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                {['Code', 'Discount', 'Min Order', 'Uses', 'Expires', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] tracking-[0.15em] uppercase text-stone-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {promos.map(p => (
                <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="px-4 py-3 font-mono text-sm font-medium text-stone-900">{p.code}</td>
                  <td className="px-4 py-3 text-sm">
                    {p.discount_type === 'percent' ? `${p.discount_value}%` : `NPR ${p.discount_value}`}
                    {p.description && <span className="text-stone-400 ml-1 text-xs">- {p.description}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-stone-500">{p.min_order_amount > 0 ? formatNPR(p.min_order_amount) : '-'}</td>
                  <td className="px-4 py-3 text-sm">{p.used_count}{p.max_uses ? `/${p.max_uses}` : ''}</td>
                  <td className="px-4 py-3 text-xs text-stone-400">{p.expires_at ? formatDate(p.expires_at) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${p.active ? 'bg-green-100 text-green-800' : 'bg-stone-100 text-stone-500'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleToggle(p)}
                        className={`text-xs px-2 py-1 border transition-colors ${p.active ? 'border-stone-300 text-stone-600 hover:border-stone-600' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
                        {p.active ? 'Disable' : 'Enable'}
                      </button>
                      <button type="button" onClick={() => handleDelete(p)}
                        className="text-xs px-2 py-1 border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Rates tab

function RatesTab({ adminKey }: { adminKey: string }) {
  const [rows, setRows] = useState<MetalRateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [saveError, setSaveError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/metal-rates', { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      setRows(data.rates || []);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const updateRow = (rateKey: string, field: keyof MetalRateRow, value: string | number | null) => {
    setRows(prev => prev.map(row => (
      row.rateKey === rateKey
        ? ({ ...row, [field]: value } as MetalRateRow)
        : row
    )));
  };

  const handleSave = async (row: MetalRateRow) => {
    setSaveError('');
    setSavingKey(row.rateKey);

    try {
      const res = await fetch('/api/metal-rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          rateKey: row.rateKey,
          label: row.label,
          pricePerGram: row.pricePerGram,
          baselinePricePerGram: row.baselinePricePerGram,
          source: row.source,
          notes: row.notes,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSaveError(data.error || 'Failed to update metal rate.');
        return;
      }

      setRows(prev => prev.map(item => item.rateKey === row.rateKey ? data.rate : item));
    } catch {
      setSaveError('Network error while updating metal rate.');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">Set the current market rate and the baseline rate used by your catalog pricing.</p>
          <p className="mt-2 text-xs text-stone-400">
            Live-priced products use: stored price + (current rate - baseline rate) x pricing weight.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="border border-stone-300 px-4 py-2 text-xs tracking-[0.15em] uppercase text-stone-600 transition-colors hover:border-stone-900"
        >
          Refresh
        </button>
      </div>

      {saveError && <p className="mb-4 text-sm text-red-600">{saveError}</p>}

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Loading...</div>
      ) : (
        <div className="bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                {['Metal', 'Current / g', 'Baseline / g', 'Source', 'Last Updated', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] tracking-[0.15em] uppercase text-stone-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.rateKey} className="border-b border-stone-100 align-top">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-stone-800">{row.label}</p>
                    <p className="mt-1 font-mono text-[11px] text-stone-400">{row.rateKey}</p>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label={`Current rate per gram for ${row.label}`}
                      value={row.pricePerGram}
                      onChange={e => updateRow(row.rateKey, 'pricePerGram', Number(e.target.value))}
                      className="w-28 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      aria-label={`Baseline rate per gram for ${row.label}`}
                      value={row.baselinePricePerGram}
                      onChange={e => updateRow(row.rateKey, 'baselinePricePerGram', Number(e.target.value))}
                      className="w-28 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={row.source || ''}
                      onChange={e => updateRow(row.rateKey, 'source', e.target.value)}
                      placeholder="e.g. Daily market sheet"
                      className="w-44 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                    />
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400">
                    {row.updatedAt ? formatDate(row.updatedAt) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSave(row)}
                      disabled={savingKey === row.rateKey}
                      className="bg-stone-900 px-4 py-2 text-xs tracking-[0.15em] uppercase text-white transition-colors hover:bg-stone-700 disabled:opacity-50"
                    >
                      {savingKey === row.rateKey ? 'Saving...' : 'Save'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InventoryTab({ adminKey }: { adminKey: string }) {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProductId, setNewProductId] = useState('');
  const [newQty, setNewQty] = useState('0');
  const [addError, setAddError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/inventory', { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      setRows(data.inventory || []);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (productId: string, qty: number) => {
    if (!Number.isInteger(qty) || qty < 0) return;
    setSaving(true);
    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ productId, quantity: qty }),
      });
      setRows(prev => {
        const existing = prev.find(r => r.product_id === productId);
        if (existing) return prev.map(r => r.product_id === productId ? { ...r, quantity: qty } : r);
        return [...prev, { product_id: productId, quantity: qty, updated_at: new Date().toISOString() }];
      });
      setEditId(null);
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = newProductId.trim().toUpperCase();
    if (!pid) { setAddError('Product ID is required.'); return; }
    if (rows.find(r => r.product_id === pid)) { setAddError('This product is already tracked. Edit it below.'); return; }
    const qty = parseInt(newQty, 10);
    if (!Number.isInteger(qty) || qty < 0) { setAddError('Quantity must be 0 or more.'); return; }
    setAddError('');
    setSaving(true);
    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ productId: pid, quantity: qty }),
      });
      setRows(prev => [...prev, { product_id: pid, quantity: qty, updated_at: new Date().toISOString() }]);
      setShowAddForm(false);
      setNewProductId('');
      setNewQty('0');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-stone-500">{rows.length} product{rows.length !== 1 ? 's' : ''} tracked</p>
        <button type="button" onClick={() => { setShowAddForm(v => !v); setAddError(''); }}
          className="bg-stone-900 text-white px-5 py-2 text-xs tracking-[0.15em] uppercase hover:bg-stone-700 transition-colors">
          {showAddForm ? 'Cancel' : '+ Track Product'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddNew} className="bg-white border border-stone-200 p-5 mb-6 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs text-stone-600 mb-1">Product ID *</label>
            <input
              required
              value={newProductId}
              onChange={e => { setNewProductId(e.target.value.toUpperCase()); setAddError(''); }}
              placeholder="e.g. BR004"
              className="border border-stone-300 px-3 py-2 text-sm font-mono focus:outline-none focus:border-stone-900 w-36"
            />
          </div>
          <div>
            <label htmlFor="newStockQty" className="block text-xs text-stone-600 mb-1">Initial Stock *</label>
            <input
              id="newStockQty"
              required
              type="number"
              min="0"
              value={newQty}
              onChange={e => setNewQty(e.target.value)}
              className="border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900 w-24"
            />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={saving}
              className="bg-stone-900 text-white px-5 py-2 text-xs tracking-[0.15em] uppercase hover:bg-stone-700 disabled:opacity-50 transition-colors">
              {saving ? 'Saving...' : 'Add'}
            </button>
          </div>
          {addError && <p className="w-full text-red-600 text-xs">{addError}</p>}
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Loading...</div>
      ) : rows.length === 0 ? (
        <div className="bg-white border border-stone-200 py-12 text-center text-stone-400 text-sm">
          No stock tracked yet. Click &quot;+ Track Product&quot; to add a product.
        </div>
      ) : (
        <div className="bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                {['Product ID', 'Stock Qty', 'Last Updated', 'Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] tracking-[0.15em] uppercase text-stone-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.product_id} className={`border-b border-stone-100 hover:bg-stone-50 ${row.quantity === 0 ? 'bg-red-50' : row.quantity <= 2 ? 'bg-amber-50' : ''}`}>
                  <td className="px-4 py-3 font-mono text-sm text-stone-800">
                    {row.product_id}
                    {row.quantity === 0 && <span className="ml-2 text-[10px] text-red-600 uppercase tracking-wide">Out of stock</span>}
                    {row.quantity > 0 && row.quantity <= 2 && <span className="ml-2 text-[10px] text-amber-600 uppercase tracking-wide">Low stock</span>}
                  </td>
                  <td className="px-4 py-3">
                    {editId === row.product_id ? (
                      <input
                        type="number"
                        min="0"
                        aria-label={`Stock quantity for ${row.product_id}`}
                        value={editQty}
                        onChange={e => setEditQty(e.target.value)}
                        className="w-20 border border-stone-300 px-2 py-1 text-sm focus:outline-none focus:border-stone-900"
                        autoFocus
                      />
                    ) : (
                      <span className={`text-sm font-medium ${row.quantity === 0 ? 'text-red-600' : row.quantity <= 2 ? 'text-amber-600' : 'text-stone-800'}`}>
                        {row.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-stone-400">{formatDate(row.updated_at)}</td>
                  <td className="px-4 py-3">
                    {editId === row.product_id ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => handleSave(row.product_id, parseInt(editQty, 10))} disabled={saving}
                          className="text-xs text-white bg-stone-900 px-3 py-1 hover:bg-stone-700 disabled:opacity-50">
                          {saving ? '...' : 'Save'}
                        </button>
                        <button type="button" onClick={() => setEditId(null)}
                          className="text-xs text-stone-600 border border-stone-300 px-3 py-1 hover:border-stone-600">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setEditId(row.product_id); setEditQty(String(row.quantity)); }}
                        className="text-xs text-stone-500 border border-stone-200 px-3 py-1 hover:border-stone-900 hover:text-stone-900">
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Abandoned carts tab

function AbandonedCartsTab({ adminKey }: { adminKey: string }) {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecovered, setShowRecovered] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/carts/list', { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      setCarts(data.carts || []);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const handleMarkRecovered = async (id: string) => {
    await fetch('/api/carts/mark-recovered', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
      body: JSON.stringify({ id }),
    });
    setCarts(prev => prev.map(c => c.id === id ? { ...c, recovered: true } : c));
  };

  const visible = carts.filter(c => showRecovered || !c.recovered);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center gap-2 text-sm text-stone-500 cursor-pointer">
          <input type="checkbox" checked={showRecovered} onChange={e => setShowRecovered(e.target.checked)} />
          Show recovered
        </label>
        <button type="button" onClick={load}
          className="border border-stone-300 text-stone-600 px-4 py-2 text-xs tracking-[0.15em] uppercase hover:border-stone-900 transition-colors">
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-stone-400 text-sm">Loading...</div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-stone-200 py-12 text-center text-stone-400 text-sm">
          No abandoned carts in the last 14 days.
        </div>
      ) : (
        <div className="bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                {['Date', 'Name', 'Phone', 'Items', 'Subtotal', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] tracking-[0.15em] uppercase text-stone-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(cart => {
                const waUrl = cart.phone
                  ? `https://wa.me/977${cart.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                      `Hi ${cart.name || 'there'}! You left something at Aashish Jewellers worth ${formatNPR(cart.subtotal)}. We're holding it for you: https://www.aashish.website/checkout`
                    )}`
                  : null;
                return (
                  <tr key={cart.id} className={`border-b border-stone-100 hover:bg-stone-50 ${cart.recovered ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 text-xs text-stone-400">{formatDate(cart.created_at)}</td>
                    <td className="px-4 py-3 text-sm text-stone-700">{cart.name || '-'}</td>
                    <td className="px-4 py-3 text-sm font-mono text-stone-700">{cart.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-stone-500">{Array.isArray(cart.items) ? cart.items.length : 0} item(s)</td>
                    <td className="px-4 py-3 text-sm font-light">{formatNPR(cart.subtotal)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {waUrl && !cart.recovered && (
                          <a href={waUrl} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-green-700 border border-green-300 px-3 py-1 hover:bg-green-50 transition-colors">
                            <MessageCircle className="w-3 h-3" strokeWidth={1.5} />
                            WhatsApp
                          </a>
                        )}
                        {!cart.recovered && (
                          <button type="button" onClick={() => handleMarkRecovered(cart.id)}
                            className="text-xs text-stone-500 border border-stone-200 px-3 py-1 hover:border-stone-600 hover:text-stone-700">
                            Recovered
                          </button>
                        )}
                        {cart.recovered && (
                          <span className="text-xs text-green-600 border border-green-200 px-3 py-1 rounded-full">Recovered</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Products tab

const EMPTY_PRODUCT_FORM = {
  id: '', name: '', category: 'rings', material: '925_silver',
  price: '', original_price: '', description: '', care_instructions: '',
  weight: '', dimensions: '', in_stock: true, is_new: false,
  images: '', tags: '',
};

function ProductsTab({ adminKey }: { adminKey: string }) {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY_PRODUCT_FORM>({ ...EMPTY_PRODUCT_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products/admin-list', { headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_PRODUCT_FORM });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (p: DbProduct) => {
    setEditingId(p.id);
    setForm({
      id: p.id,
      name: p.name,
      category: p.category,
      material: p.material,
      price: String(p.price),
      original_price: p.original_price != null ? String(p.original_price) : '',
      description: p.description || '',
      care_instructions: p.care_instructions || '',
      weight: p.weight || '',
      dimensions: p.dimensions || '',
      in_stock: p.in_stock,
      is_new: p.is_new,
      images: (p.images || []).join('\n'),
      tags: (p.tags || []).join(', '),
    });
    setFormError('');
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id || !form.name || !form.price) {
      setFormError('ID, name, and price are required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        id: form.id.trim(),
        name: form.name.trim(),
        category: form.category.trim(),
        material: form.material.trim(),
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        description: form.description || null,
        care_instructions: form.care_instructions || null,
        weight: form.weight || null,
        dimensions: form.dimensions || null,
        in_stock: form.in_stock,
        is_new: form.is_new,
        images: form.images.split('\n').map(s => s.trim()).filter(Boolean),
        tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      };

      const isEdit = editingId !== null;
      const res = await fetch(
        isEdit ? '/api/products/update' : '/api/products/create',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Save failed');
        return;
      }
      setShowForm(false);
      setEditingId(null);
      load();
    } catch {
      setFormError('Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.\n\nNote: if a markdown file with the same ID exists, that version will reappear.`)) return;
    try {
      await fetch('/api/products/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ id }),
      });
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Delete failed. Please try again.');
    }
  };

  const handleStockToggle = async (p: DbProduct) => {
    try {
      const res = await fetch('/api/products/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ id: p.id, in_stock: !p.in_stock }),
      });
      if (res.ok) {
        setProducts(prev => prev.map(x => x.id === p.id ? { ...x, in_stock: !x.in_stock } : x));
      }
    } catch { /* silently fail */ }
  };

  const inputCls = 'w-full border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-medium text-stone-900">Products (DB)</h2>
          <p className="text-xs text-stone-400 mt-0.5">DB products override markdown files with the same ID</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="bg-stone-900 text-white px-4 py-2 text-xs tracking-[0.15em] uppercase hover:bg-stone-700 transition-colors"
        >
          + Add Product
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-stone-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-stone-900 mb-4">
            {editingId ? `Edit: ${editingId}` : 'New Product'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">ID (slug) *</label>
              <input className={inputCls} value={form.id} readOnly={editingId !== null}
                onChange={e => setForm(f => ({ ...f, id: e.target.value }))} placeholder="e.g. BR005" required />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Name *</label>
              <input aria-label="Product name" className={inputCls} value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Category</label>
              <input className={inputCls} value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="rings, bracelets..." />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Material</label>
              <input className={inputCls} value={form.material}
                onChange={e => setForm(f => ({ ...f, material: e.target.value }))} placeholder="925_silver" />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Price (NPR) *</label>
              <input aria-label="Product price in NPR" className={inputCls} type="number" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Original Price (NPR)</label>
              <input className={inputCls} type="number" value={form.original_price}
                onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} placeholder="optional" />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Weight</label>
              <input className={inputCls} value={form.weight}
                onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="e.g. 5g" />
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Dimensions</label>
              <input className={inputCls} value={form.dimensions}
                onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))} placeholder="e.g. 18mm diameter" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Description</label>
              <textarea aria-label="Product description" className={`${inputCls} min-h-20`} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Care Instructions</label>
              <input aria-label="Product care instructions" className={inputCls} value={form.care_instructions}
                onChange={e => setForm(f => ({ ...f, care_instructions: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Images (one URL per line)</label>
              <textarea className={`${inputCls} min-h-20 font-mono text-xs`} value={form.images}
                onChange={e => setForm(f => ({ ...f, images: e.target.value }))}
                placeholder="/images/jewelry/BR005.jpg&#10;/images/jewelry/BR005-b.jpg" />
              {form.images.trim() && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {form.images.split('\n').map(s => s.trim()).filter(Boolean).map((url, i) => (
                    <img key={i} src={url} alt={`Preview ${i + 1}`}
                      className="h-16 w-16 object-cover border border-stone-200 bg-stone-100"
                      onError={e => { e.currentTarget.style.opacity = '0.3'; }} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[11px] tracking-[0.12em] uppercase text-stone-500 mb-1">Tags (comma-separated)</label>
              <input className={inputCls} value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="gift, bestseller" />
            </div>
            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.in_stock}
                  onChange={e => setForm(f => ({ ...f, in_stock: e.target.checked }))} />
                <span className="text-sm text-stone-700">In Stock</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_new}
                  onChange={e => setForm(f => ({ ...f, is_new: e.target.checked }))} />
                <span className="text-sm text-stone-700">New Badge</span>
              </label>
            </div>
          </div>

          {formError && <p className="text-red-600 text-sm mt-4">{formError}</p>}

          <div className="flex gap-3 mt-5">
            <button type="submit" disabled={saving}
              className="bg-stone-900 text-white px-5 py-2 text-xs tracking-[0.15em] uppercase hover:bg-stone-700 transition-colors disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Product'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="border border-stone-300 text-stone-600 px-5 py-2 text-xs tracking-[0.15em] uppercase hover:border-stone-900 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-stone-400 py-8 text-center">Loading products...</p>
      ) : products.length === 0 ? (
        <div className="bg-white border border-stone-200 py-16 text-center">
          <p className="text-stone-500">No DB products yet. Markdown products still appear on the site.</p>
          <p className="text-xs text-stone-400 mt-1">Add a product above to manage it from the dashboard.</p>
        </div>
      ) : (
        <div className="bg-white border border-stone-200 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                {['', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-[11px] tracking-[0.15em] uppercase text-stone-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const img = p.images?.[0];
                return (
                  <tr key={p.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="w-10 h-10 bg-[#f0ebe3] overflow-hidden">
                        {img && <img src={img} alt="" className="w-full h-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-stone-900">{p.name}</p>
                      <p className="text-[11px] font-mono text-stone-400">{p.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600">{p.category}</td>
                    <td className="px-4 py-3 text-sm text-stone-900">
                      NPR {Number(p.price).toLocaleString()}
                      {p.original_price && (
                        <span className="ml-1 text-[11px] text-stone-400 line-through">
                          NPR {Number(p.original_price).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleStockToggle(p)}
                        className={`text-[11px] px-2 py-1 border transition-colors ${
                          p.in_stock
                            ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            : 'border-stone-300 text-stone-500 hover:border-stone-500'
                        }`}
                      >
                        {p.in_stock ? 'In Stock' : 'Out of Stock'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openEdit(p)}
                          className="text-xs text-stone-600 border border-stone-200 px-3 py-1 hover:border-stone-600 transition-colors">
                          Edit
                        </button>
                        <button type="button" onClick={() => handleDelete(p.id, p.name)}
                          className="text-xs text-red-600 border border-red-200 px-3 py-1 hover:bg-red-50 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Main dashboard

type DashTab = 'orders' | 'promos' | 'rates' | 'inventory' | 'carts' | 'products' | 'flash';

// ── Flash Sale Tab ────────────────────────────────────────────────────────────

interface ActiveFlashSale {
  id: number;
  title: string;
  subtitle?: string | null;
  discount_percent: number;
  ends_at: string;
  created_at: string;
}

function FlashSaleTab({ adminKey }: { adminKey: string }) {
  const [activeSale, setActiveSale] = useState<ActiveFlashSale | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', subtitle: '', discount_percent: '10', ends_at: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const fetchSale = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/flash-sale');
      const data = await res.json();
      setActiveSale(data.sale || null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSale(); }, [fetchSale]);

  async function handleLaunch(e: React.FormEvent) {
    e.preventDefault();
    setErr(''); setMsg('');
    if (!form.title.trim()) { setErr('Title is required.'); return; }
    const pct = parseFloat(form.discount_percent);
    if (isNaN(pct) || pct <= 0 || pct >= 100) { setErr('Discount must be between 1 and 99%.'); return; }
    if (!form.ends_at) { setErr('End date/time is required.'); return; }
    if (new Date(form.ends_at) <= new Date()) { setErr('End time must be in the future.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/flash-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          title: form.title.trim(),
          subtitle: form.subtitle.trim() || null,
          discount_percent: pct,
          ends_at: new Date(form.ends_at).toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Failed to launch sale.'); return; }
      setMsg('✓ Flash sale is live!');
      setForm({ title: '', subtitle: '', discount_percent: '10', ends_at: '' });
      await fetchSale();
    } catch {
      setErr('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleEnd() {
    if (!window.confirm('End the active flash sale now?')) return;
    try {
      await fetch('/api/flash-sale', { method: 'DELETE', headers: { 'x-admin-key': adminKey } });
      setActiveSale(null);
      setMsg('Sale ended.');
    } catch {
      setErr('Failed to end sale.');
    }
  }

  function formatEndsAt(iso: string) {
    return new Date(iso).toLocaleString('en-NP', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  // Minimum datetime for the input (now + 5 min)
  const minDateTime = new Date(Date.now() + 5 * 60_000).toISOString().slice(0, 16);

  return (
    <div className="max-w-xl space-y-8">
      {/* Active sale card */}
      {loading ? (
        <p className="text-sm text-stone-400">Loading...</p>
      ) : activeSale ? (
        <div className="border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber-500" strokeWidth={2} />
                <span className="text-xs uppercase tracking-[0.14em] text-amber-600 font-medium">Active Sale</span>
              </div>
              <p className="font-medium text-stone-900">{activeSale.title}</p>
              {activeSale.subtitle && <p className="text-sm text-stone-500 mt-0.5">{activeSale.subtitle}</p>}
              <p className="text-sm mt-2 text-stone-700">
                <span className="font-semibold text-amber-600">{activeSale.discount_percent}% off</span> all products
              </p>
              <p className="text-xs text-stone-400 mt-1">Ends: {formatEndsAt(activeSale.ends_at)}</p>
            </div>
            <button
              onClick={handleEnd}
              className="shrink-0 border border-red-300 text-red-600 px-3 py-1.5 text-xs uppercase tracking-[0.14em] hover:bg-red-50 transition-colors"
            >
              End Sale
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-stone-200 bg-white p-5 text-sm text-stone-400 text-center">
          No active flash sale.
        </div>
      )}

      {/* Launch form */}
      <div>
        <h2 className="text-xs uppercase tracking-[0.18em] text-stone-500 mb-4">
          {activeSale ? 'Replace Active Sale' : 'Launch New Flash Sale'}
        </h2>
        <form onSubmit={handleLaunch} className="space-y-4">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Sale Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Teej Special Sale"
              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Subtitle <span className="text-stone-400">(optional)</span></label>
            <input
              type="text"
              value={form.subtitle}
              onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
              placeholder="e.g. Free shipping on all orders"
              className="w-full border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="flash-sale-discount" className="block text-xs text-stone-500 mb-1">Discount % *</label>
            <input
              id="flash-sale-discount"
              type="number"
              min="1"
              max="99"
              step="1"
              value={form.discount_percent}
              onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))}
              className="w-32 border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="flash-sale-ends-at" className="block text-xs text-stone-500 mb-1">Sale Ends At *</label>
            <input
              id="flash-sale-ends-at"
              type="datetime-local"
              min={minDateTime}
              value={form.ends_at}
              onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))}
              className="border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          {msg && <p className="text-xs text-emerald-600">{msg}</p>}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 text-xs uppercase tracking-[0.18em] hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            <Zap className="w-3.5 h-3.5" strokeWidth={2} />
            {saving ? 'Launching...' : 'Launch Sale'}
          </button>
        </form>
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

export default function AdminDashboard() {
  const [adminKey, setAdminKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<DashTab>('orders');
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const fetchData = useCallback(async (key: string) => {
    setRefreshing(true);
    try {
      const statsRes = await fetch('/api/orders/stats', { headers: { 'x-admin-key': key } });
      if (!statsRes.ok) { setAuthed(false); return; }
      const statsData = await statsRes.json();
      setStats(statsData);
      setAuthed(true);

      // Fetch orders + analytics in parallel (non-blocking — failures don't affect auth)
      const [ordersRes, revenueRes, topRes] = await Promise.allSettled([
        fetch('/api/orders/list?limit=200', { headers: { 'x-admin-key': key } }),
        fetch('/api/orders/daily-revenue', { headers: { 'x-admin-key': key } }),
        fetch('/api/orders/top-products', { headers: { 'x-admin-key': key } }),
      ]);

      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const d = await ordersRes.value.json();
        setOrders(d.orders || []);
      }
      if (revenueRes.status === 'fulfilled' && revenueRes.value.ok) {
        const d = await revenueRes.value.json();
        setDailyRevenue(d.days || []);
      }
      if (topRes.status === 'fulfilled' && topRes.value.ok) {
        const d = await topRes.value.json();
        setTopProducts(d.products || []);
      }
    } catch {
      // silently fail on refresh
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleAuth = (key: string) => {
    setAdminKey(key);
    fetchData(key);
    setAuthed(true);
  };

  const handleLogout = () => {
    setAdminKey('');
    setAuthed(false);
    setStats(null);
    setOrders([]);
  };

  const handleStatusChange = (id: string, status: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  // Reset to page 1 when any filter changes
  useEffect(() => { setCurrentPage(1); }, [filterStatus, searchQuery, dateFrom, dateTo]);

  if (!authed) return <LockScreen onAuth={handleAuth} />;

  const filteredOrders = orders.filter(o => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!o.customer?.name?.toLowerCase().includes(q) && !o.customer?.phone?.toLowerCase().includes(q)) return false;
    }
    if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(o.created_at) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const pendingCount = stats?.byStatus?.pending?.count ?? 0;

  const TABS: { id: DashTab; label: string; icon: React.ReactNode }[] = [
    { id: 'orders', label: 'Orders', icon: <Package className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'promos', label: 'Promos', icon: <Tag className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'rates', label: 'Metal Rates', icon: <RefreshCw className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'inventory', label: 'Inventory', icon: <Wrench className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'carts', label: 'Abandoned Carts', icon: <MessageCircle className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" strokeWidth={1.5} /> },
    { id: 'flash', label: 'Flash Sale', icon: <Zap className="w-4 h-4" strokeWidth={1.5} /> },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <SiteMeta title="Admin Dashboard" noindex={true} />

      {/* Top bar */}
      <div className="bg-stone-900 text-white px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-white/50">Store Admin</p>
          <h1 className="text-lg font-light tracking-wide">Aashish Jewellers - Order Management</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fetchData(adminKey)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-xs tracking-[0.15em] uppercase hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 border border-white/20 px-4 py-2 text-xs tracking-[0.15em] uppercase hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <StatCard label="Total Orders" value={stats.totalOrders} />
            <StatCard
              label="Pending Orders"
              value={pendingCount}
              sub={pendingCount > 0 ? 'Needs attention' : 'All caught up'}
            />
            <StatCard label="Total Revenue" value={formatNPR(Math.round(stats.totalRevenue))} sub="Confirmed + delivered" />
          </div>
        )}

        {/* Revenue chart + top products */}
        {(dailyRevenue.length > 0 || topProducts.length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
            <RevenueChart days={dailyRevenue} />
            <TopProductsWidget products={topProducts} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-0 border-b border-stone-200 mb-8 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-5 py-3 text-xs tracking-[0.15em] uppercase border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-stone-900 text-stone-900'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders tab */}
        {activeTab === 'orders' && (
          <>
            {/* Search + Date + CSV row */}
            <div className="flex flex-wrap gap-3 mb-4 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full border border-stone-300 pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-stone-900"
                />
              </div>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                aria-label="From date"
                className="border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
              />
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                aria-label="To date"
                className="border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
              />
              <button
                type="button"
                onClick={() => exportOrdersCSV(filteredOrders)}
                className="inline-flex items-center gap-2 border border-stone-300 px-4 py-2 text-xs tracking-[0.15em] uppercase text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-colors"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                Export CSV
              </button>
            </div>

            {/* Status filter tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {FILTER_TABS.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 text-xs tracking-[0.15em] uppercase border transition-colors ${
                    filterStatus === status
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-300 text-stone-600 hover:border-stone-900'
                  }`}
                >
                  {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== 'all' && stats?.byStatus?.[status]?.count
                    ? ` (${stats.byStatus[status].count})`
                    : ''}
                </button>
              ))}
            </div>

            <div className="bg-white border border-stone-200 overflow-x-auto">
              {filteredOrders.length === 0 ? (
                <div className="py-16 text-center text-stone-500">
                  {orders.length === 0 ? 'No orders yet.' : 'No orders match the current filters.'}
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      {['Order ID', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map(h => (
                        <th key={h} className="px-4 py-3 text-[11px] tracking-[0.15em] uppercase text-stone-500 font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map(order => (
                      <OrderRow
                        key={order.id}
                        order={order}
                        adminKey={adminKey}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer: count + pagination */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-stone-400">
                Showing {paginatedOrders.length} of {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                {filteredOrders.length !== orders.length ? ` (filtered from ${orders.length})` : ''}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs border border-stone-300 text-stone-600 hover:border-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-stone-500">Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs border border-stone-300 text-stone-600 hover:border-stone-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'promos' && <PromosTab adminKey={adminKey} />}
        {activeTab === 'rates' && <RatesTab adminKey={adminKey} />}
        {activeTab === 'inventory' && <InventoryTab adminKey={adminKey} />}
        {activeTab === 'carts' && <AbandonedCartsTab adminKey={adminKey} />}
        {activeTab === 'products' && <ProductsTab adminKey={adminKey} />}
        {activeTab === 'flash' && <FlashSaleTab adminKey={adminKey} />}
      </div>
    </div>
  );
}
