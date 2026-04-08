/**
 * Consolidated orders handler — routes by sub-path to stay within
 * Vercel Hobby plan's 12-function limit.
 *
 * POST  /api/orders/create
 * GET   /api/orders/list
 * GET   /api/orders/lookup
 * POST  /api/orders/update-status
 * POST  /api/orders/add-note
 * GET   /api/orders/history
 * GET   /api/orders/stats
 * GET   /api/orders/daily-revenue
 * GET   /api/orders/top-products
 */

import { createOrder, confirmOrder, updateOrderStatus, getOrderStats, getOrderById } from '../lib/db-store.js';
import {
  assertSubmittedTotal,
  normalizeAndPriceOrderItems,
  OrderValidationError,
} from '../lib/order-pricing.js';
import { rateLimit } from '../lib/rate-limiter.js';
import { requireAdminAuth } from '../lib/admin-auth.js';
import { queryMany, query } from '../lib/db.js';
import { sendWhatsAppMessage } from '../lib/whatsapp.js';

const ALLOWED_PAYMENT_METHODS = new Set(['cod', 'whatsapp', 'esewa', 'khalti', 'fonepay']);
const createOrderRateLimit = rateLimit({ windowMs: 60_000, max: 5, message: 'Too many order attempts. Please wait.' });
const lookupRateLimit = rateLimit({ windowMs: 60_000, max: 10 });
const historyRateLimit = rateLimit({ windowMs: 60_000, max: 3, message: 'Too many requests. Please wait a moment.' });

function normalizePhone(value) {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('977') && digits.length > 10) digits = digits.slice(3);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function getAction(req) {
  const pathname = req.url.split('?')[0];
  const match = pathname.match(/\/orders\/(.+)$/);
  return match ? match[1] : '';
}

export default async function handler(req, res) {
  const action = getAction(req);

  // POST /api/orders/create
  if (action === 'create') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const allowed = await createOrderRateLimit(req, res);
    if (!allowed) return;
    try {
      const { items, customer, total, paymentMethod, promoCode } = req.body;
      if (!items || !customer || !paymentMethod) return res.status(400).json({ error: 'Missing required fields' });
      if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) return res.status(400).json({ error: 'Unsupported payment method' });
      if (!customer.name || !customer.phone || !customer.address?.street || !customer.address?.district) {
        return res.status(400).json({ error: 'Incomplete customer information' });
      }
      const pricing = await normalizeAndPriceOrderItems(items, promoCode || null);
      assertSubmittedTotal(total, pricing.total);
      const order = await createOrder({ items: pricing.items, customer, total: pricing.total, paymentMethod, status: 'pending', promoCode: pricing.appliedPromo || null, discountAmount: pricing.discountAmount || 0 });
      if (!order || !order.id) return res.status(500).json({ error: 'Order creation failed' });
      return res.status(200).json({ success: true, orderId: order.id, total: pricing.total, discountAmount: pricing.discountAmount, message: paymentMethod === 'cod' ? 'Order placed successfully! We will call you to confirm.' : 'Order created successfully!' });
    } catch (error) {
      if (error instanceof OrderValidationError) return res.status(400).json({ error: error.message, ...(error.details ? { details: error.details } : {}) });
      console.error('Order creation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/orders/list (admin)
  if (action === 'list') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    try {
      const limit = Math.min(parseInt(req.query?.limit ?? '200', 10), 500);
      const orders = await queryMany('SELECT id, items, customer, total, payment_method, status, notes, created_at FROM orders ORDER BY created_at DESC LIMIT $1', [limit]);
      return res.status(200).json({ orders: orders || [] });
    } catch (error) {
      console.error('[orders/list] error:', error.message);
      return res.status(200).json({ orders: [] });
    }
  }

  // GET /api/orders/lookup (public, requires phone)
  if (action === 'lookup') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const allowed = await lookupRateLimit(req, res);
    if (!allowed) return;
    const { id, phone } = req.query;
    if (!id || typeof id !== 'string' || id.trim().length === 0 || !phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Order ID and phone number are required' });
    }
    const order = await getOrderById(id.trim());
    if (!order || normalizePhone(order.customer?.phone) !== normalizePhone(phone)) {
      return res.status(404).json({ error: 'Order not found' });
    }
    return res.status(200).json({ id: order.id, status: order.status, items: order.items, total: order.total, paymentMethod: order.payment_method || order.paymentMethod, createdAt: order.created_at || order.createdAt });
  }

  // POST /api/orders/update-status (admin)
  if (action === 'update-status') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'processing', 'dispatched', 'delivered']);
    const NOTIFY_STATUSES = new Set(['confirmed', 'dispatched', 'delivered']);
    const { orderId, status } = req.body || {};
    if (!orderId || !status) return res.status(400).json({ error: 'Missing orderId or status' });
    if (!ALLOWED_STATUSES.has(status)) return res.status(400).json({ error: `Invalid status. Allowed: ${[...ALLOWED_STATUSES].join(', ')}` });
    try {
      const order = status === 'confirmed' ? await confirmOrder(orderId) : await updateOrderStatus(orderId, status);
      if (!order) return res.status(404).json({ error: 'Order not found' });
      let whatsappSent = false;
      if (NOTIFY_STATUSES.has(status) && order.customer?.phone) {
        const result = await sendWhatsAppMessage(order.customer.phone, `order_${status}`, [order.customer.name || 'Customer', orderId, String(order.total)]).catch(() => ({ success: false }));
        whatsappSent = result.success;
      }
      return res.status(200).json({ success: true, order, whatsappSent });
    } catch (err) {
      console.error('update-status error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/orders/add-note (admin)
  if (action === 'add-note') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    try {
      const { orderId, note } = req.body ?? {};
      if (!orderId) return res.status(400).json({ error: 'orderId required' });
      await query('UPDATE orders SET notes = $1 WHERE id = $2', [note || null, orderId]);
      return res.status(200).json({ success: true });
    } catch {
      return res.status(500).json({ error: 'Failed to save note' });
    }
  }

  // GET /api/orders/history (public, requires phone)
  if (action === 'history') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const allowed = await historyRateLimit(req, res);
    if (!allowed) return;
    const { orderId, phone } = req.query;
    if (!orderId || typeof orderId !== 'string' || !phone || typeof phone !== 'string') {
      return res.status(400).json({ error: 'Order ID and phone number are required' });
    }
    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length < 7 || normalizedPhone.length > 15) return res.status(400).json({ error: 'Invalid phone number' });
    try {
      const order = await getOrderById(orderId.trim());
      if (!order || normalizePhone(order.customer?.phone) !== normalizedPhone) return res.status(404).json({ orders: [] });
      return res.status(200).json({ orders: [{ id: order.id, total: order.total, status: order.status, payment_method: order.payment_method, items: order.items, created_at: order.created_at }] });
    } catch (err) {
      console.error('Order history error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/orders/stats (admin)
  if (action === 'stats') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    const byStatus = await getOrderStats();
    const totalOrders = Object.values(byStatus).reduce((sum, s) => sum + (s.count || 0), 0);
    const EXCLUDED = ['cancelled', 'refunded', 'failed'];
    const totalRevenue = Object.entries(byStatus).filter(([status]) => !EXCLUDED.includes(status)).reduce((sum, [, s]) => sum + (parseFloat(s.revenue) || 0), 0);
    return res.status(200).json({ byStatus, totalOrders, totalRevenue });
  }

  // GET /api/orders/daily-revenue (admin)
  if (action === 'daily-revenue') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    try {
      const days = await queryMany(`SELECT DATE(created_at AT TIME ZONE 'Asia/Kathmandu') AS day, COUNT(*)::int AS orders, COALESCE(SUM(total), 0)::numeric AS revenue FROM orders WHERE created_at >= NOW() - INTERVAL '30 days' AND status NOT IN ('cancelled', 'refunded', 'failed') GROUP BY day ORDER BY day`);
      return res.status(200).json({ days: days || [] });
    } catch {
      return res.status(200).json({ days: [] });
    }
  }

  // GET /api/orders/top-products (admin)
  if (action === 'top-products') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    if (!requireAdminAuth(req, res)) return;
    try {
      const products = await queryMany(`SELECT item->>'id' AS product_id, item->>'name' AS name, SUM((item->>'price')::numeric * (item->>'quantity')::int) AS revenue, SUM((item->>'quantity')::int) AS units FROM orders, jsonb_array_elements(items) AS item WHERE status NOT IN ('cancelled', 'refunded', 'failed') GROUP BY product_id, name ORDER BY revenue DESC LIMIT 5`);
      return res.status(200).json({ products: products || [] });
    } catch {
      return res.status(200).json({ products: [] });
    }
  }

  return res.status(404).json({ error: 'Unknown orders endpoint' });
}
