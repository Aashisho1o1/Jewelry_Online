import { validateOrder } from '../../../lib/validator.js';
import logger from '../../../lib/logger.js';
import { paymentRateLimit } from '../../../lib/rate-limiter.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const allowed = await paymentRateLimit(req, res);
  if (!allowed) return;

  try {
    logger.log('FonePay payment request received');
    
    // Validate and sanitize order data
    const validation = validateOrder(req.body);
    if (!validation.valid) {
      logger.warn('Invalid order data:', validation.errors);
      return res.status(400).json({ 
        error: 'Invalid order data',
        details: validation.errors 
      });
    }
    
    // Use sanitized data
    const { customer, total, items } = validation.sanitizedData;

    // Generate order ID with FonePay prefix for easy identification
    const orderId = `FNP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Import order store
    const { createOrder } = await import('../../../lib/db-store.js');
    
    // Create order in our store with FonePay-specific details
    const order = await createOrder({
      id: orderId,
      items,
      customer,
      total: parseFloat(total),
      paymentMethod: 'fonepay',
      status: 'pending', // Will be updated to 'confirmed' after manual verification
      paymentDetails: {
        provider: 'fonepay',
        qrDisplayed: true,
        awaitingVerification: true,
        createdAt: new Date().toISOString()
      }
    });

    logger.log('FonePay order created:', orderId);

    // In a real implementation, you might:
    // 1. Generate dynamic QR code with order details
    // 2. Set up webhook for automatic payment verification
    // 3. Send SMS/email with payment instructions

    return res.status(200).json({
      success: true,
      orderId: order.id,
      qrCodeUrl: '/images/fonepay-qr-code.jpg', // Static QR for now
      paymentInstructions: {
        amount: parseFloat(total),
        reference: orderId,
        merchantName: 'Aashish Jewellers',
        instructions: [
          'Open your FonePay mobile app',
          'Scan the QR code displayed',
          `Enter amount: NPR ${parseFloat(total).toLocaleString()}`,
          `Use reference: ${orderId}`,
          'Complete the payment',
          'Click "I\'ve Paid" to notify us'
        ]
      },
      message: 'FonePay QR code generated. Please scan and pay.',
    });

  } catch (error) {
    logger.error('FonePay payment creation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create FonePay payment. Please try again.'
    });
  }
}
