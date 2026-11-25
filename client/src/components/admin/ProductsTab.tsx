import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { calculateFormulaPrice, inferMetalRateKey } from '../../../../lib/metal-pricing.js';

type Status = 'draft' | 'live' | 'hidden';
type PriceMode = 'manual' | 'formula';

interface AdminProduct {
  id: string; name: string; category: string; material: string; status: Status;
  price: number | string; current_price: number; original_price: number | string | null;
  price_mode: PriceMode | null; wastage_percent: number | string | null; making_charge: number | string | null;
  making_charge_type: string | null; stone_cost: number | string | null; pricing_weight_grams: number | string | null;
  description: string | null; care_instructions: string | null; weight: string | null; dimensions: string | null;
  in_stock: boolean; is_new: boolean; featured: boolean; images: string[]; stock: number | null;
}
interface CmsProduct { id: string; name: string; category: string; price: number; image: string }
interface Rate { rateKey: string; pricePerGram: number; isActive: boolean; sourceLabel: string }

const TYPES: [string, string][] = [
  ['rings', 'Ring'], ['necklaces', 'Necklace'], ['earrings', 'Earring'], ['bracelets', 'Bracelet'], ['sets', 'Set'],
  ['tilahari', 'Tilahari'], ['mangalsutra', 'Mangalsutra'], ['sikri', 'Sikri'], ['baala', 'Baala'], ['bulaki', 'Bulaki'],
  ['pote', 'Pote'], ['pauju', 'Pauju'], ['maang-tika', 'Maang Tika'], ['haar', 'Haar'], ['dhungri', 'Dhungri'],
];
const METALS: [string, string][] = [
  ['925_silver', '925 Silver'], ['gold_24k', '24K Gold'], ['gold_22k', '22K Gold'], ['gold_18k', '18K Gold'],
  ['gold_plated', 'Gold plated'], ['rose_gold_plated', 'Rose gold plated'], ['stone_studded', 'Stone studded'],
  ['mixed_metals', 'Mixed metals'], ['beaded', 'Beaded'],
];
const GRAMS_PER_TOLA = 11.664;
const STATUS_LABEL: Record<Status, string> = { draft: 'Draft', live: 'In shop', hidden: 'Hidden' };
const STATUS_STYLE: Record<Status, string> = {
  draft: 'bg-amber-100 text-amber-800', live: 'bg-emerald-100 text-emerald-800', hidden: 'bg-stone-200 text-stone-600',
};
const INPUT = 'h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base focus:border-forest-900 focus:outline-none';
const npr = (value: number) => `NPR ${Math.round(value).toLocaleString('en-IN')}`;
const label = (list: [string, string][], value: string) => list.find(([id]) => id === value)?.[1] ?? value;
const str = (value: unknown) => (value === null || value === undefined ? '' : String(value));

const EMPTY = {
  name: '', category: 'rings', material: '925_silver', weight: '', price_mode: 'manual' as PriceMode, price: '',
  wastage_percent: '', making_charge: '', making_charge_type: 'fixed', stone_cost: '', pricing_weight_grams: '',
  original_price: '', description: '', care_instructions: '', dimensions: '', images: '', is_new: true, featured: false, stock: '1',
};
type Form = typeof EMPTY;

function toForm(p: AdminProduct): Form {
  return {
    name: p.name, category: p.category, material: p.material, weight: str(p.weight).replace(/g$/, ''),
    price_mode: p.price_mode === 'formula' ? 'formula' : 'manual', price: str(Number(p.price) || ''),
    wastage_percent: str(p.wastage_percent), making_charge: str(p.making_charge), making_charge_type: p.making_charge_type || 'fixed',
    stone_cost: str(p.stone_cost), pricing_weight_grams: str(p.pricing_weight_grams), original_price: str(p.original_price),
    description: str(p.description), care_instructions: str(p.care_instructions), dimensions: str(p.dimensions),
    images: (p.images || []).join('\n'), is_new: p.is_new, featured: p.featured, stock: str(p.stock),
  };
}

function Field({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-800">{title}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

function Choices({ title, options, value, onChange }: { title: string; options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-stone-800">{title}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([id, text]) => (
          <button
            key={id}
            type="button"
            aria-pressed={value === id}
            onClick={() => onChange(id)}
            className={cn('h-11 rounded-full border px-4 text-sm', value === id ? 'border-forest-900 bg-forest-900 text-white' : 'border-stone-300 bg-white text-stone-700')}
          >
            {text}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ProductForm({ product, rates, adminKey, onClose, onSaved }: {
  product: AdminProduct | null; rates: Rate[]; adminKey: string; onClose: () => void; onSaved: (message: string) => void;
}) {
  const [initial] = useState<Form>(() => (product ? toForm(product) : { ...EMPTY }));
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState<{ text: string; status: Status } | null>(null);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setConfirm(null);
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const grams = Number(form.weight) || 0;
  const rate = rates.find(r => r.rateKey === inferMetalRateKey(form.material) && r.isActive);
  const result = calculateFormulaPrice({
    ratePerGram: rate?.pricePerGram,
    weightGrams: Number(form.pricing_weight_grams) || grams,
    wastagePercent: form.wastage_percent,
    makingCharge: form.making_charge,
    makingChargeType: form.making_charge_type,
    stoneCost: form.stone_cost,
  });
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  const close = () => {
    if (!dirty || window.confirm('Close without saving?')) onClose();
  };

  const suggestDescription = () => {
    const weight = grams ? ` Weight: ${grams}g.` : '';
    set('description', `${label(METALS, form.material)} ${label(TYPES, form.category).toLowerCase()} from Aashish Jewellers, Butwal.${weight}`);
  };

  const save = async (status: Status, confirmPrice = false) => {
    setSaving(true);
    setError('');
    setConfirm(null);
    try {
      const { stock, images, weight, ...rest } = form;
      const res = await fetch(product ? '/api/products/update' : '/api/products/create', {
        method: product ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          ...rest,
          ...(product ? { id: product.id } : {}),
          weight: weight || null,
          images: images.split('\n').map(s => s.trim()).filter(Boolean),
          status,
          confirmPrice,
          // Sent only when changed here, so a sale made meanwhile is not overwritten.
          ...(stock !== '' && (!product || stock !== initial.stock) ? { stock: Number(stock) } : {}),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSaved(`${data.product.name} (${data.product.id}) saved: ${STATUS_LABEL[data.product.status as Status]}.`);
        return;
      }
      if (data.needsConfirm) setConfirm({ text: data.error, status });
      else setError(data.error || 'Could not save.');
    } catch {
      setError('No connection. Nothing was saved.');
    } finally {
      setSaving(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    save('live');
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-stone-200 bg-cream p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-stone-900">{product ? product.name : 'Add product'}</h2>
        <span className="rounded-full bg-white px-3 py-1 text-xs text-stone-600">{product ? `Code ${product.id}` : 'Code is given automatically'}</span>
      </div>

      <Choices title="Type" options={TYPES} value={form.category} onChange={v => set('category', v)} />
      <Choices title="Metal" options={METALS} value={form.material} onChange={v => set('material', v)} />

      <Field title="Name"><input className={INPUT} value={form.name} maxLength={120} onChange={e => set('name', e.target.value)} /></Field>
      <Field title="Weight (grams)" hint={grams ? `= ${(grams / GRAMS_PER_TOLA).toFixed(3)} tola` : undefined}>
        <input className={INPUT} type="number" inputMode="decimal" min="0" step="0.001" value={form.weight} onChange={e => set('weight', e.target.value)} />
      </Field>

      <div className="space-y-4 rounded-xl bg-white p-4">
        <Choices title="Price" options={[['manual', 'Fixed'], ['formula', "Today's rate"]]} value={form.price_mode} onChange={v => set('price_mode', v as PriceMode)} />
        {form.price_mode === 'manual' ? (
          <Field title="Sell price (NPR)">
            <input className={INPUT} type="number" inputMode="numeric" min="0" step="1" value={form.price} onChange={e => set('price', e.target.value)} />
          </Field>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field title="Wastage / Jarti %">
                <input className={INPUT} type="number" inputMode="decimal" min="0" max="50" step="0.1" value={form.wastage_percent} onChange={e => set('wastage_percent', e.target.value)} />
              </Field>
              <Field title="Stones (NPR)">
                <input className={INPUT} type="number" inputMode="numeric" min="0" value={form.stone_cost} onChange={e => set('stone_cost', e.target.value)} />
              </Field>
              <Field title="Making / Jyala">
                <input className={INPUT} type="number" inputMode="decimal" min="0" step="0.1" value={form.making_charge} onChange={e => set('making_charge', e.target.value)} />
              </Field>
              <Field title="Making is">
                <select className={INPUT} value={form.making_charge_type} onChange={e => set('making_charge_type', e.target.value)}>
                  <option value="fixed">NPR per piece</option>
                  <option value="per_gram">NPR per gram</option>
                  <option value="percent">% of metal</option>
                </select>
              </Field>
            </div>
            <div className="rounded-xl bg-forest-50 p-4 text-sm text-stone-700" aria-live="polite">
              {result ? (
                <>
                  {([[`Metal (rate ${rate?.pricePerGram})`, result.metal], ['Wastage', result.wastage], ['Making', result.making], ['Stones', result.stones]] as [string, number][]).map(([text, value]) => (
                    <div key={text} className="flex justify-between py-0.5"><span>{text}</span><span>{npr(value)}</span></div>
                  ))}
                  <div className="mt-2 flex justify-between border-t border-forest-200 pt-2 text-lg font-semibold text-forest-900"><span>Sell price today</span><span>{npr(result.price)}</span></div>
                </>
              ) : !inferMetalRateKey(form.material) ? 'This metal has no daily rate. Use a fixed price.'
                : !rate ? 'There is no rate for this metal. Add it under Metal rates.' : 'Enter the weight to see the price.'}
            </div>
          </>
        )}
      </div>

      <Field title="In stock (pieces)" hint="0 shows as sold out. Empty means stock is not counted.">
        <input className={INPUT} type="number" inputMode="numeric" min="0" max="999" step="1" value={form.stock} onChange={e => set('stock', e.target.value)} />
      </Field>

      <Field title="Photos" hint="Photo upload comes in the next step. For now, one address per line, like /images/jewelry/dragon.jpg">
        <textarea className={cn(INPUT, 'h-24 py-2 text-sm')} value={form.images} onChange={e => set('images', e.target.value)} />
      </Field>

      <details className="rounded-xl bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-stone-800">More details</summary>
        <div className="mt-4 space-y-4">
          <Field title="Description"><textarea className={cn(INPUT, 'h-28 py-2')} maxLength={3000} value={form.description} onChange={e => set('description', e.target.value)} /></Field>
          <button type="button" onClick={suggestDescription} className="h-11 rounded-full border border-stone-300 px-4 text-sm">Write a simple description</button>
          <Field title="Old price, crossed out (NPR)" hint="Only a price you really sold it at">
            <input className={INPUT} type="number" inputMode="numeric" min="0" value={form.original_price} onChange={e => set('original_price', e.target.value)} />
          </Field>
          {form.price_mode === 'formula' && (
            <Field title="Weight without stones (grams)" hint="Only if the weight above includes stones">
              <input className={INPUT} type="number" inputMode="decimal" min="0" step="0.001" value={form.pricing_weight_grams} onChange={e => set('pricing_weight_grams', e.target.value)} />
            </Field>
          )}
          <Field title="Size" hint="Example: 18 inch chain"><input className={INPUT} maxLength={120} value={form.dimensions} onChange={e => set('dimensions', e.target.value)} /></Field>
          <Field title="Care"><input className={INPUT} maxLength={1000} value={form.care_instructions} onChange={e => set('care_instructions', e.target.value)} /></Field>
          <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.is_new} onChange={e => set('is_new', e.target.checked)} />New arrival</label>
          <label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" className="h-5 w-5" checked={form.featured} onChange={e => set('featured', e.target.checked)} />Featured</label>
        </div>
      </details>

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {confirm && (
        <div role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <p>{confirm.text}</p>
          <button type="button" disabled={saving} onClick={() => save(confirm.status, true)} className="mt-3 h-11 rounded-full bg-amber-700 px-5 text-white">Yes, change the price</button>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="submit" disabled={saving} className="h-12 rounded-full bg-forest-900 text-sm font-medium text-white disabled:opacity-50 sm:order-2">{saving ? 'Saving...' : product?.status === 'live' ? 'Save changes' : 'Show in shop'}</button>
        <button type="button" disabled={saving} onClick={() => save(product?.status === 'live' ? 'hidden' : 'draft')} className="h-12 rounded-full border border-stone-400 text-sm disabled:opacity-50">
          {product?.status === 'live' ? 'Save and hide from shop' : 'Save as draft'}
        </button>
      </div>
      <button type="button" onClick={close} className="h-11 w-full text-sm text-stone-600 underline">Cancel</button>
    </form>
  );
}

export default function ProductsTab({ adminKey }: { adminKey: string }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [cmsProducts, setCmsProducts] = useState<CmsProduct[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<AdminProduct | 'new' | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, rateRes] = await Promise.all([
        fetch('/api/products/admin-list', { headers: { 'x-admin-key': adminKey } }),
        fetch('/api/rates').catch(() => null),
      ]);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProducts(data.products || []);
      setCmsProducts(data.cmsProducts || []);
      if (rateRes?.ok) setRates((await rateRes.json()).rates || []);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : 'Could not load products.');
    } finally {
      setLoading(false);
    }
  }, [adminKey]);

  useEffect(() => { load(); }, [load]);

  const changeStatus = async (product: AdminProduct, status: Status) => {
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/products/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ id: product.id, status }),
      });
      const data = await res.json();
      if (!res.ok) setError(`${product.name}: ${data.error}`);
      else {
        setMessage(`${product.name}: ${STATUS_LABEL[status]}.`);
        load();
      }
    } catch {
      setError('No connection. Nothing was changed.');
    }
  };

  if (editing) {
    return (
      <ProductForm
        key={editing === 'new' ? 'new' : editing.id}
        product={editing === 'new' ? null : editing}
        rates={rates}
        adminKey={adminKey}
        onClose={() => setEditing(null)}
        onSaved={text => { setEditing(null); setMessage(text); load(); window.scrollTo(0, 0); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl text-stone-900">Products</h2>
        <button type="button" onClick={() => { setMessage(''); setEditing('new'); }} className="h-11 rounded-full bg-forest-900 px-5 text-sm font-medium text-white">+ Add product</button>
      </div>
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="py-8 text-center text-sm text-stone-500">Loading products...</p>}

      {!loading && (
        <ul className="grid gap-3 lg:grid-cols-2">
          {products.map(p => (
            <li key={p.id} className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-card">
                {p.images?.[0] && <img src={p.images[0]} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-medium text-stone-900">{p.name}</p>
                  <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs', STATUS_STYLE[p.status])}>{STATUS_LABEL[p.status]}</span>
                </div>
                <p className="text-xs text-stone-500">
                  {p.id} · {npr(p.current_price)}{p.price_mode === 'formula' ? " (today's rate)" : ''} · {p.stock === null ? (p.in_stock ? 'in stock' : 'sold out') : `${p.stock} in stock`}
                </p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { setMessage(''); setEditing(p); }} className="h-10 rounded-full border border-stone-300 px-4 text-sm">Edit</button>
                  <button type="button" onClick={() => changeStatus(p, p.status === 'live' ? 'hidden' : 'live')} className="h-10 rounded-full border border-stone-300 px-4 text-sm">
                    {p.status === 'live' ? 'Hide' : 'Show in shop'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {!loading && !products.length && !error && <p className="rounded-2xl bg-white p-6 text-center text-sm text-stone-600">No products added here yet.</p>}

      {!loading && cmsProducts.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-medium text-stone-700">Still in the laptop CMS ({cmsProducts.length})</h3>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cmsProducts.map(p => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-white p-2 text-sm">
                <img src={p.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <span className="min-w-0"><span className="block truncate">{p.name}</span><span className="text-xs text-stone-500">{p.id}</span></span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
