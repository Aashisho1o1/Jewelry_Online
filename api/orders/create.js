import { createOrder, incrementPromoUsage, decrementStock } from '../../lib/db-store.js';
import {
  assertSubmittedTotal,
  normalizeAndPriceOrderItems,
  OrderValidationError,
} from '../../lib/order-pricing.js';

const ALLOWED_PAYMENT_METHODS = new Set(['cod', 'whatsapp', 'esewa', 'khalti', 'fonepay']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      promoCode: pricing.appliedPromo || null,
      discountAmount: pricing.discountAmount || 0,
    });

    if (!order || !order.id) {
      return res.status(500).json({ error: 'Order creation failed' });
    }

    // Fire-and-forget: increment promo usage + decrement stock
    if (pricing.appliedPromo) {
      incrementPromoUsage(pricing.appliedPromo).catch(err =>
        console.error('Failed to increment promo usage:', err)
      );
    }
    for (const item of pricing.items) {
      decrementStock(item.id, item.quantity).catch(err =>
        console.error(`Failed to decrement stock for ${item.id}:`, err)
      );
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
