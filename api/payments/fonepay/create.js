import { validateOrder } from '../../../lib/validator.js';
import logger from '../../../lib/logger.js';
import { paymentRateLimit } from '../../../lib/rate-limiter.js';
import {
  assertSubmittedTotal,
  normalizeAndPriceOrderItems,
  OrderValidationError,
} from '../../../lib/order-pricing.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await paymentRateLimit(req, res);
  if (!allowed) return;

  try {
    logger.log('FonePay payment request received');

    const pricing = await normalizeAndPriceOrderItems(req.body?.items);
    assertSubmittedTotal(req.body?.total, pricing.total);

    const validation = validateOrder({
      ...req.body,
      items: pricing.items,
      total: pricing.total,
    });

    if (!validation.valid) {
      logger.warn('Invalid order data:', validation.errors);
      return res.status(400).json({
        error: 'Invalid order data',
        details: validation.errors,
      });
    }

    const { customer, items } = validation.sanitizedData;
    const orderId = `FNP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const { createOrder } = await import('../../../lib/db-store.js');

    const order = await createOrder({
      id: orderId,
      items,
      customer,
      total: pricing.total,
      paymentMethod: 'fonepay',
      status: 'pending',
      paymentDetails: {
        provider: 'fonepay',
        qrDisplayed: true,
        awaitingVerification: true,
        createdAt: new Date().toISOString(),
      },
    });

    logger.log('FonePay order created:', orderId);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      qrCodeUrl: '/images/fonepay-qr-code.jpg',
      paymentInstructions: {
        amount: pricing.total,
        reference: orderId,
        merchantName: 'Aashish Jewellers',
        instructions: [
          'Open your FonePay mobile app',
          'Scan the QR code displayed',
          `Enter amount: NPR ${pricing.total.toLocaleString()}`,
          `Use reference: ${orderId}`,
          'Complete the payment',
          'Click "I\'ve Paid" to notify us',
        ],
      },
      message: 'FonePay QR code generated. Please scan and pay.',
    });
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return res.status(400).json({
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    logger.error('FonePay payment creation error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create FonePay payment. Please try again.',
    });
  }
}
