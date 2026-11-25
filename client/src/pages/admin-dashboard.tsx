import React, { useCallback, useEffect, useState } from 'react';
import { BarChart2, ChevronDown, ChevronUp, Download, LogOut, MessageCircle, Package, Printer, RefreshCw, Search, Tag, Wrench, Zap } from 'lucide-react';
import ProductsTab from '@/components/admin/ProductsTab';
import OrderCard, { exportOrdersCSV, type AdminOrder } from '@/components/admin/OrderCard';
import SiteMeta, { SITE_URL } from '@/components/SiteMeta';

// Types

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
  items: unknown[];
  subtotal: number;
  created_at: string;
  recovered: boolean;
}

// Constants

// Must match real status values; 'shipped' never matched the 'dispatched' status.
const FILTER_TABS = ['all', 'pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'];

// Helpers

function formatNPR(amount: number) {
  return 'NPR ' + Math.round(amount).toLocaleString('en-IN');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

// Mirrors lib/nepal-rates.js: share of pure metal per purity, and grams in a tola.
const GRAMS_PER_TOLA = 11.664;
const PURITY: Record<string, { metal: 'gold' | 'silver'; factor: number }> = {
  silver_925: { metal: 'silver', factor: 0.925 },
  gold_24k: { metal: 'gold', factor: 1 },
  gold_22k: { metal: 'gold', factor: 0.916 },
  gold_18k: { metal: 'gold', factor: 0.75 },
};

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

  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [tola, setTola] = useState({ gold: '', silver: '' });

  // Pulls today's FENEGOSIDA rates on the server (the same job the daily cron runs).
  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    setSaveError('');
    try {
      const res = await fetch('/api/metal-rates/sync', { method: 'POST', headers: { 'x-admin-key': adminKey } });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(`FENEGOSIDA: ${data.error || 'sync failed'}. Rates were not changed.`);
        return;
      }
      const skipped = data.skipped?.length ? ` Skipped (changed over 15%): ${data.skipped.map((s: { rateKey: string }) => s.rateKey).join(', ')}.` : '';
      setSyncMessage(`Saved FENEGOSIDA rates for ${data.date}: fine gold NPR ${Math.round(data.fineGoldPerGram).toLocaleString()}/g, pure silver NPR ${data.fineSilverPerGram.toFixed(2)}/g.${skipped}`);
      await load();
    } catch {
      setSaveError('Network error while fetching FENEGOSIDA rates.');
    } finally {
      setSyncing(false);
    }
  };

  // Published rates are for pure metal per tola; convert to per gram at each purity.
  const fillFromTola = () => {
    setRows(prev => prev.map(row => {
      const purity = PURITY[row.rateKey];
      const perTola = Number(tola[purity?.metal ?? 'gold']);
      if (!purity || !(perTola > 0)) return row;
      return { ...row, pricePerGram: Math.round((perTola / GRAMS_PER_TOLA) * purity.factor * 100) / 100, source: 'Entered per tola' };
    }));
    setSyncMessage('Current rates filled from your per-tola entry. Press "Save all" to apply them.');
  };

  const handleSaveAll = async () => {
    for (const row of rows) await handleSave(row);
    setSyncMessage('All rates saved.');
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
            Calculated products use: current rate x weight + wastage + making charge + stones (set in the CMS; no baseline needed). Older live-priced products use: stored price + (current rate - baseline rate) x weight.
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

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="border border-stone-200 bg-white p-4">
          <p className="text-sm font-medium text-stone-800">Automatic daily rate</p>
          <p className="mt-1 text-xs text-stone-500">
            Every day at about 11:15 Nepal time the site fetches FENEGOSIDA&apos;s published gold and silver rates and updates
            &quot;Current / g&quot; for each purity. Unusual data (missing, mismatched, or over 15% change) is skipped and the previous rate stays.
          </p>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing}
            className="mt-3 bg-stone-900 px-4 py-2 text-xs uppercase tracking-[0.15em] text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {syncing ? 'Fetching...' : "Fetch today's rate now"}
          </button>
        </div>
        <div className="border border-stone-200 bg-white p-4">
          <p className="text-sm font-medium text-stone-800">Enter today&apos;s rate per tola</p>
          <p className="mt-1 text-xs text-stone-500">Type the published fine gold and pure silver rate per tola; each purity is worked out for you.</p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            {(['gold', 'silver'] as const).map(metal => (
              <label key={metal} className="flex flex-col gap-1 text-xs text-stone-500">
                {metal === 'gold' ? 'Fine gold / tola' : 'Pure silver / tola'}
                <input
                  type="number"
                  min="0"
                  inputMode="decimal"
                  value={tola[metal]}
                  onChange={e => setTola(t => ({ ...t, [metal]: e.target.value }))}
                  className="w-36 border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:border-stone-900"
                />
              </label>
            ))}
            <button type="button" onClick={fillFromTola} className="border border-stone-300 px-4 py-2 text-xs uppercase tracking-[0.15em] text-stone-700 hover:border-stone-900">
              Fill rates
            </button>
            <button type="button" onClick={handleSaveAll} disabled={savingKey !== null} className="bg-stone-900 px-4 py-2 text-xs uppercase tracking-[0.15em] text-white hover:bg-stone-700 disabled:opacity-50">
              Save all
            </button>
          </div>
        </div>
      </div>

      <p className="mb-4 text-xs text-stone-500">
        <strong className="font-medium text-stone-700">Baseline / g</strong> is set once: the rate your product prices were based on. Don&apos;t change it daily;
        while it is 0, products keep their fixed prices.
      </p>

      {syncMessage && <p className="mb-4 text-sm text-emerald-700">{syncMessage}</p>}
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
                      `Hi ${cart.name || 'there'}! You left something at Aashish Jewellers worth ${formatNPR(cart.subtotal)}. We're holding it for you: ${SITE_URL}/checkout`
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
      const searchable = [o.id, o.customer?.name, o.customer?.phone, ...(o.items || []).flatMap(i => [i.id, i.name])];
      if (!searchable.some(value => String(value || '').toLowerCase().includes(q))) return false;
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
                  placeholder="Search name, phone, order ID or product code..."
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

            {filteredOrders.length === 0 ? (
              <div className="rounded-2xl border border-stone-200 bg-white py-16 text-center text-stone-500">
                {orders.length === 0 ? 'No orders yet.' : 'No orders match the current filters.'}
              </div>
            ) : (
              <div className="grid items-start gap-4 lg:grid-cols-2">
                {paginatedOrders.map(order => (
                  <OrderCard key={order.id} order={order} adminKey={adminKey} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}

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
