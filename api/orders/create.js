import { createOrder } from '../../lib/db-store.js';
import {
  assertSubmittedTotal,
  normalizeAndPriceOrderItems,
  OrderValidationError,
} from '../../lib/order-pricing.js';
import { rateLimit } from '../../lib/rate-limiter.js';

const ALLOWED_PAYMENT_METHODS = new Set(['cod', 'whatsapp', 'esewa', 'khalti', 'fonepay']);
const createOrderRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many order attempts. Please wait a moment before trying again.',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await createOrderRateLimit(req, res);
  if (!allowed) return;

  try {
    const { items, customer, total, paymentMethod, promoCode } = req.body;

    if (!items || !customer || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!ALLOWED_PAYMENT_METHODS.has(paymentMethod)) {
      return res.status(400).json({ error: 'Unsupported payment method' });
    }

    if (!customer.name || !customer.phone || !customer.address?.street || !customer.address?.district) {
      return res.status(400).json({ error: 'Incomplete customer information' });
    }

    const pricing = await normalizeAndPriceOrderItems(items, promoCode || null);
    assertSubmittedTotal(total, pricing.total);

    const order = await createOrder({
      items: pricing.items,
      customer,
      total: pricing.total,
      paymentMethod,
      status: 'pending',
      promoCode: pricing.appliedPromo || null,
      discountAmount: pricing.discountAmount || 0,
    });

    if (!order || !order.id) {
      return res.status(500).json({ error: 'Order creation failed' });
    }

    return res.status(200).json({
      success: true,
      orderId: order.id,
      total: pricing.total,
      discountAmount: pricing.discountAmount,
      message: paymentMethod === 'cod'
        ? 'Order placed successfully! We will call you to confirm.'
        : 'Order created successfully!',
    });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return res.status(400).json({
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    console.error('Order creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
