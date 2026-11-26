import { useState } from 'react';
import { MessageCircle, Phone, Printer } from 'lucide-react';
import { SITE_URL } from '@/components/SiteMeta';
import { countText, orderLinesText, sizeText, type OrderLine } from '@/lib/order-lines';
import { RING_SIZE_UNSURE } from '@/lib/ring-sizes';

export interface AdminOrder {
  id: string;
  items: (OrderLine & { image: string })[];
  customer: {
    name: string;
    phone: string;
    email?: string;
    address: { street: string; district: string; zone?: string; landmark?: string };
    giftOptions?: {
      isGift?: boolean; giftWrap?: boolean; giftCard?: boolean; giftNote?: string;
      recipient?: string; occasion?: string; specialInstructions?: string;
    };
  };
  total: number;
  payment_method: string;
  status: string;
  notes?: string | null;
  created_at: string;
}

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled', 'refunded', 'failed'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  dispatched: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-50 text-red-600',
};
// Closing returns stock and can't be undone, so the admin confirms first.
const CLOSED_STATUSES = new Set(['cancelled', 'refunded', 'failed']);
export const PAYMENT_LABELS: Record<string, string> = {
  cod: 'COD', whatsapp: 'WhatsApp', esewa: 'eSewa', khalti: 'Khalti', fonepay: 'FonePay',
};

const npr = (value: number) => `NPR ${Math.round(Number(value)).toLocaleString('en-IN')}`;

export const addressText = (order: AdminOrder) => {
  const a = order.customer?.address;
  return [a?.street, a?.landmark, a?.district, a?.zone].filter(Boolean).join(', ');
};

function giftLines(order: AdminOrder) {
  const gift = order.customer?.giftOptions;
  if (!gift?.isGift) return [];
  return [
    gift.giftWrap && 'Gift wrap',
    gift.giftCard && 'Gift card',
    gift.recipient && `For: ${gift.recipient}`,
    gift.occasion && `Occasion: ${gift.occasion}`,
    gift.giftNote && `Note: ${gift.giftNote}`,
    gift.specialInstructions && `Instructions: ${gift.specialInstructions}`,
  ].filter((line): line is string => Boolean(line));
}

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Packing slip: every item with a tick box, photo, code and size.
function printOrder(order: AdminOrder) {
  const w = window.open('', '_blank', 'width=720,height=900');
  if (!w) {
    alert('Allow pop-ups for this page to print.');
    return;
  }
  const gift = giftLines(order);
  const rows = (order.items || []).map((item, index) => {
    const src = /^\/(?!\/)/.test(item.image || '') ? window.location.origin + item.image : '';
    return `<tr><td class="tick">&#9744;</td><td>${index + 1}</td><td>${src ? `<img src="${escapeHtml(src)}" alt="">` : ''}</td>
      <td><b>${escapeHtml(item.id)}</b><br>${escapeHtml(item.name)}</td><td><b>${escapeHtml(sizeText(item.size) || '-')}</b></td>
      <td class="qty">${escapeHtml(item.quantity)}</td><td>${escapeHtml(npr(item.price * item.quantity))}</td></tr>`;
  }).join('');
  // Escape customer-typed fields before writing printable HTML into the popup.
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Order ${escapeHtml(order.id)}</title><style>
    body{font-family:Arial,sans-serif;padding:24px;font-size:13px;color:#111}h1{font-size:17px;margin:0 0 10px;border-bottom:2px solid #000;padding-bottom:8px}
    p{margin:4px 0}table{width:100%;border-collapse:collapse;margin:14px 0}td,th{border:1px solid #bbb;padding:6px;text-align:left;vertical-align:middle}
    th{background:#f3f3f3}img{width:64px;height:64px;object-fit:cover;display:block}.tick{font-size:22px}.qty{font-size:18px;font-weight:bold}
    tr{page-break-inside:avoid}.box{border:1px solid #bbb;padding:8px;margin-top:10px}</style></head><body>
  <h1>Aashish Jewellers: packing slip</h1>
  <p><b>${escapeHtml(order.id)}</b> | ${escapeHtml(new Date(order.created_at).toLocaleString())}</p>
  <p><b>${escapeHtml(countText(order.items || []))}</b> | ${escapeHtml(PAYMENT_LABELS[order.payment_method] || order.payment_method)} | ${escapeHtml(order.status)}</p>
  <div class="box"><b>${escapeHtml(order.customer?.name)}</b>, ${escapeHtml(order.customer?.phone)}<br>${escapeHtml(addressText(order))}</div>
  <table><tr><th></th><th>#</th><th>Photo</th><th>Product</th><th>Size</th><th>Qty</th><th>Price</th></tr>${rows}</table>
  <p style="font-size:16px"><b>Total: ${escapeHtml(npr(order.total))}</b></p>
  ${gift.length ? `<div class="box"><b>GIFT</b><br>${gift.map(escapeHtml).join('<br>')}</div>` : ''}
  ${order.notes ? `<div class="box"><b>Shop note:</b> ${escapeHtml(order.notes)}</div>` : ''}
  <script>window.onload=function(){window.print()}</script></body></html>`);
  w.document.close();
}

export function exportOrdersCSV(orders: AdminOrder[]) {
  const headers = ['Order ID', 'Customer', 'Phone', 'Address', 'Pieces', 'Items', 'Total', 'Payment', 'Status', 'Date', 'Gift', 'Notes'];
  const rows = orders.map(o => [
    o.id,
    o.customer?.name || '',
    o.customer?.phone || '',
    addressText(o),
    (o.items || []).reduce((sum, i) => sum + i.quantity, 0),
    (o.items || []).map(i => `${i.id} ${i.name}${i.size ? ` (${sizeText(i.size)})` : ''} x${i.quantity}`).join('; '),
    o.total,
    o.payment_method,
    o.status,
    new Date(o.created_at).toLocaleDateString(),
    giftLines(o).join('; '),
    o.notes || '',
  ]);
  // Customer-entered text starting with = + - @ would run as a formula in Excel/Sheets; prefix ' to keep it text.
  const csvCell = (c: unknown) => {
    const s = String(c ?? '');
    return `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  };
  const csv = [headers, ...rows].map(r => r.map(csvCell).join(',')).join('\n');
  const a = document.createElement('a');
  // BOM so Excel shows Nepali text correctly.
  a.href = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

function customerWhatsAppUrl(order: AdminOrder) {
  const digits = String(order.customer?.phone || '').replace(/\D/g, '').replace(/^0+/, '');
  const phone = digits.length === 10 ? `977${digits}` : digits;
  const text = `Namaste ${order.customer?.name || ''}, thank you for your order ${order.id} from Aashish Jewellers.\n\n${orderLinesText(order.items || [], SITE_URL)}\n\nTotal: ${npr(order.total)} (${PAYMENT_LABELS[order.payment_method] || order.payment_method})\nAddress: ${addressText(order)}\n\nPlease reply YES to confirm.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

const ACTION = 'inline-flex h-11 items-center gap-2 rounded-full border border-stone-300 bg-white px-4 text-sm text-stone-800';

export default function OrderCard({ order, adminKey, onStatusChange }: {
  order: AdminOrder; adminKey: string; onStatusChange: (id: string, status: string) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [note, setNote] = useState(order.notes || '');
  const [noteState, setNoteState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const items = order.items || [];
  const unsure = items.filter(item => item.size === RING_SIZE_UNSURE).length;
  const gift = giftLines(order);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const difference = Number(order.total) - subtotal;

  const changeStatus = async (status: string) => {
    if (status === order.status) return;
    if (CLOSED_STATUSES.has(status) && !window.confirm(`Mark this order as ${status}? Stock is returned and this can't be undone.`)) return;
    setUpdating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ orderId: order.id, status }),
      });
      const data = await res.json();
      if (!res.ok) setMessage({ ok: false, text: data.error || 'Update failed' });
      else {
        onStatusChange(order.id, status);
        setMessage({ ok: true, text: data.whatsappSent ? 'Saved, WhatsApp sent' : 'Saved' });
      }
    } catch {
      setMessage({ ok: false, text: 'No connection. Not saved.' });
    } finally {
      setUpdating(false);
    }
  };

  const saveNote = async () => {
    setNoteState('saving');
    try {
      const res = await fetch('/api/orders/add-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ orderId: order.id, note }),
      });
      setNoteState(res.ok ? 'saved' : 'failed');
    } catch {
      setNoteState('failed');
    }
  };

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 sm:p-5" data-order={order.id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-medium text-stone-900">{order.customer?.name || 'No name'}</p>
          <p className="break-all font-mono text-xs text-stone-500">{order.id}</p>
          <p className="text-xs text-stone-500">{new Date(order.created_at).toLocaleString()}</p>
        </div>
        <div>
          <select
            aria-label="Order status"
            value={order.status}
            onChange={e => changeStatus(e.target.value)}
            disabled={updating || CLOSED_STATUSES.has(order.status)}
            className={`h-11 rounded-full border-0 px-4 text-base font-medium md:text-sm ${STATUS_COLORS[order.status] || 'bg-stone-100 text-stone-700'}`}
          >
            {VALID_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          {message && <p role="status" className={`mt-1 text-xs ${message.ok ? 'text-emerald-700' : 'text-red-600'}`}>{message.text}</p>}
        </div>
      </div>

      <p className="mt-3 rounded-xl bg-forest-50 px-3 py-2 text-sm font-medium text-forest-900">
        {countText(items)} · {npr(order.total)} · {PAYMENT_LABELS[order.payment_method] || order.payment_method}
      </p>
      {unsure > 0 && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">Call to confirm the size ({unsure} {unsure === 1 ? 'item' : 'items'}).</p>}

      <ol className="mt-3 divide-y divide-stone-100">
        {items.map((item, index) => (
          <li key={`${item.id}-${index}`} className="flex gap-3 py-3">
            <a href={`/products/${encodeURIComponent(item.id)}`} target="_blank" rel="noopener noreferrer" className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-cream-card">
              <img src={item.image} alt={item.name} loading="lazy" className="h-full w-full object-cover" />
            </a>
            <div className="min-w-0 flex-1 text-sm">
              <p className="text-stone-900"><span className="font-mono font-semibold">{item.id}</span> {item.name}</p>
              {item.size && <p className={item.size === RING_SIZE_UNSURE ? 'font-medium text-amber-800' : 'font-medium text-stone-800'}>{sizeText(item.size)}</p>}
              <p className="text-stone-600">{npr(item.price)} each = {npr(item.price * item.quantity)}</p>
            </div>
            <p className="shrink-0 text-lg font-semibold text-stone-900">× {item.quantity}</p>
          </li>
        ))}
      </ol>
      {difference !== 0 && <p className="text-right text-xs text-stone-500">Items {npr(subtotal)}, delivery and discount {difference > 0 ? '+' : '-'}{npr(Math.abs(difference))}</p>}

      {gift.length > 0 && (
        <div className="mt-3 rounded-xl bg-cream-gift p-3 text-sm text-stone-800">
          <p className="font-medium">Gift order</p>
          {gift.map(line => <p key={line} className="break-words">{line}</p>)}
        </div>
      )}

      <p className="mt-3 text-sm text-stone-700">{order.customer?.phone}<br />{addressText(order)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`tel:${String(order.customer?.phone || '').replace(/[^\d+]/g, '')}`} className={ACTION}><Phone className="h-4 w-4" />Call</a>
        <a href={customerWhatsAppUrl(order)} target="_blank" rel="noopener noreferrer" className={ACTION}><MessageCircle className="h-4 w-4" />WhatsApp customer</a>
        <button type="button" onClick={() => printOrder(order)} className={ACTION}><Printer className="h-4 w-4" />Packing slip</button>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-stone-600">Private note{order.notes ? ' (has note)' : ''}</summary>
        <textarea
          aria-label="Private note"
          value={note}
          onChange={e => { setNote(e.target.value); setNoteState('idle'); }}
          className="mt-2 h-20 w-full rounded-xl border border-stone-300 px-3 py-2 text-base focus:border-forest-900 focus:outline-none md:text-sm"
        />
        <button type="button" onClick={saveNote} disabled={noteState === 'saving'} className={ACTION}>
          {{ idle: 'Save note', saving: 'Saving...', saved: 'Saved', failed: 'Not saved, try again' }[noteState]}
        </button>
      </details>
    </article>
  );
}
