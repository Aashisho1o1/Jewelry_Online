// One way to write order items, so WhatsApp, the dashboard and the packing slip always agree.
import { RING_SIZE_UNSURE } from './ring-sizes';

export interface OrderLine {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
}

const npr = (value: number) => `NPR ${Math.round(value).toLocaleString('en-IN')}`;

export function sizeText(size?: string | null) {
  if (!size) return '';
  return size === RING_SIZE_UNSURE ? 'Size to confirm' : `Size ${size}`;
}

export const pieceCount = (items: { quantity: number }[]) => items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

export function countText(items: { id: string; quantity: number }[]) {
  const products = new Set(items.map(item => item.id)).size;
  const pieces = pieceCount(items);
  return `${products} product${products === 1 ? '' : 's'}, ${pieces} piece${pieces === 1 ? '' : 's'}`;
}

/** Numbered lines: code, name, size, quantity, price and (with siteUrl) a link that shows the photos. */
export function orderLinesText(items: OrderLine[], siteUrl?: string) {
  return items.map((item, index) => [
    `${index + 1}. *${item.id}* ${item.name}`,
    `   ${[sizeText(item.size), `Qty ${item.quantity}`].filter(Boolean).join(', ')} = ${npr(item.price * item.quantity)}`,
    ...(siteUrl ? [`   ${siteUrl}/products/${encodeURIComponent(item.id)}`] : []),
  ].join('\n')).join('\n');
}
