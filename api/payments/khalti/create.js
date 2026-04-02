import {
  assertSubmittedTotal,
  normalizeAndPriceOrderItems,
  OrderValidationError,
} from '../../../lib/order-pricing.js';
import { paymentRateLimit } from '../../../lib/rate-limiter.js';

function buildBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && !vercelUrl.startsWith('http')) return `https://${vercelUrl}`;
  if (vercelUrl) return vercelUrl;

  return 'http://localhost:5000';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await paymentRateLimit(req, res);
  if (!allowed) return;

  try {
    const { items, customer, total } = req.body;

    if (!items || !customer) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!customer.name || !customer.phone) {
      return res.status(400).json({ error: 'Incomplete customer information' });
    }

    const pricing = await normalizeAndPriceOrderItems(items);
    assertSubmittedTotal(total, pricing.total);

    const khaltiSecretKey = process.env.KHALTI_SECRET_KEY;
    if (!khaltiSecretKey) {
      return res.status(500).json({
        error: 'Payment gateway not configured',
        message: 'Khalti payment is temporarily unavailable. Please try another payment method.',
      });
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const amountBreakdown = [
      {
        label: 'Jewelry Items',
        amount: Math.round(pricing.subtotal * 100),
      },
    ];

    if (pricing.deliveryFee > 0) {
      amountBreakdown.push({
        label: 'Delivery',
        amount: Math.round(pricing.deliveryFee * 100),
      });
    }

    const khaltiPayload = {
      return_url: `${buildBaseUrl()}/api/payments/khalti/verify`,
      website_url: buildBaseUrl(),
      amount: Math.round(pricing.total * 100),
      purchase_order_id: orderId,
      purchase_order_name: `Aashish Jewellers - Order ${orderId}`,
      customer_info: {
        name: customer.name,
        email: customer.email || `customer-${orderId}@example.com`,
        phone: customer.phone,
      },
      amount_breakdown: amountBreakdown,
      product_details: pricing.items.map(item => ({
        identity: item.id,
        name: item.name,
        total_price: Math.round(item.price * item.quantity * 100),
        quantity: item.quantity,
        unit_price: Math.round(item.price * 100),
      })),
    };

    const khaltiResponse = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', {
      method: 'POST',
      headers: {
        Authorization: `Key ${khaltiSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(khaltiPayload),
    });

    const khaltiData = await khaltiResponse.json();

    if (khaltiResponse.ok && khaltiData.payment_url) {
      const { createOrder } = await import('../../../lib/db-store.js');

      // Only persist a pending order after the gateway gives us a valid payment session.
      await createOrder({
        id: orderId,
        items: pricing.items,
        customer,
        total: pricing.total,
        paymentMethod: 'khalti',
        status: 'pending',
        paymentDetails: {
          provider: 'khalti',
          pidx: khaltiData.pidx || null,
        },
      });

      return res.status(200).json({
        success: true,
        orderId,
        paymentUrl: khaltiData.payment_url,
        paymentToken: khaltiData.pidx,
        total: pricing.total,
        message: 'Redirecting to Khalti...',
      });
    }

    console.error('Khalti payment initiation failed:', khaltiData);

    let errorMessage = 'Failed to initiate Khalti payment';
    if (khaltiData.detail) {
      errorMessage = khaltiData.detail;
    } else if (khaltiData.error) {
      errorMessage = khaltiData.error;
    }

    return res.status(400).json({ error: errorMessage });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return res.status(400).json({
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    console.error('Khalti payment creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
