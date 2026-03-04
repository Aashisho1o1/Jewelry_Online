import { requireAdminAuth } from '../../lib/admin-auth.js';
import { updateOrderStatus } from '../../lib/db-store.js';
import { sendWhatsAppMessage } from '../../lib/whatsapp.js';

const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'processing', 'dispatched', 'delivered']);
const NOTIFY_STATUSES = new Set(['confirmed', 'dispatched', 'delivered']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!requireAdminAuth(req, res)) return;

  const { orderId, status } = req.body || {};
  if (!orderId || !status) return res.status(400).json({ error: 'Missing orderId or status' });
  if (!ALLOWED_STATUSES.has(status)) {
    return res.status(400).json({ error: `Invalid status. Allowed: ${[...ALLOWED_STATUSES].join(', ')}` });
  }

  try {
    const order = await updateOrderStatus(orderId, status);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    let whatsappSent = false;

    if (NOTIFY_STATUSES.has(status) && order.customer?.phone) {
      const { name, phone } = order.customer;
      const result = await sendWhatsAppMessage(
        phone,
        `order_${status}`,
        [name || 'Customer', orderId, String(order.total)]
      ).catch(() => ({ success: false }));
      whatsappSent = result.success;
    }

    return res.status(200).json({ success: true, order, whatsappSent });
  } catch (err) {
    console.error('update-status error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
