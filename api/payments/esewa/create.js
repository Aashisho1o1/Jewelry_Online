import crypto from 'crypto';
import {
  assertSubmittedTotal,
  normalizeAndPriceOrderItems,
  OrderValidationError,
} from '../../../lib/order-pricing.js';
import { paymentRateLimit } from '../../../lib/rate-limiter.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

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

    let parsedItems;
    let parsedCustomer;

    try {
      parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
      parsedCustomer = typeof customer === 'string' ? JSON.parse(customer) : customer;
    } catch {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    if (!parsedItems || !Array.isArray(parsedItems) || !parsedCustomer) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    if (!parsedCustomer.name || !parsedCustomer.phone) {
      return res.status(400).json({ error: 'Incomplete customer information' });
    }

    const pricing = await normalizeAndPriceOrderItems(parsedItems);
    assertSubmittedTotal(total, pricing.total);

    const timestamp = Date.now();
    const microseconds = process.hrtime.bigint().toString().slice(-6);
    const randomBytes = crypto.randomBytes(8).toString('hex');
    const transactionUuid = `TXN-${timestamp}-${microseconds}-${randomBytes}`;

    const productServiceCharge = 0;
    const productDeliveryCharge = pricing.deliveryFee;
    const taxAmount = 0;
    const amount = pricing.subtotal;
    const totalAmount = amount + taxAmount + productServiceCharge + productDeliveryCharge;

    if (Number.isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const productCode = process.env.ESEWA_PRODUCT_CODE;
    const secretKey = process.env.ESEWA_SECRET_KEY;

    if (!productCode || !secretKey) {
      return res.status(500).json({
        error: 'Payment gateway not configured',
        message: 'eSewa payment is temporarily unavailable. Please try another payment method.',
      });
    }

    const baseUrl = buildBaseUrl();
    const successUrl = `${baseUrl}/api/payments/esewa/success`;
    const failureUrl = `${baseUrl}/api/payments/esewa/failure`;

    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(message)
      .digest('base64');

    const { createOrder } = await import('../../../lib/db-store.js');
    await createOrder({
      id: transactionUuid,
      items: pricing.items,
      customer: parsedCustomer,
      total: totalAmount,
      paymentMethod: 'esewa',
      status: 'pending',
      paymentDetails: {
        provider: 'esewa',
        transactionUuid,
      },
    });

    const esewaFormHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>eSewa Payment - Aashish Jewellers</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
              padding: 0;
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 15px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 400px;
              width: 90%;
              text-align: center;
            }
            .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
            .amount { font-size: 32px; font-weight: bold; color: #28a745; margin: 20px 0; }
            .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; }
            .btn {
              background: #28a745;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              width: 100%;
              margin-top: 20px;
              transition: background 0.3s;
            }
            .btn:hover { background: #218838; }
            .secure { font-size: 12px; color: #666; margin-top: 15px; }
            .loader {
              border: 3px solid #f3f3f3;
              border-top: 3px solid #28a745;
              border-radius: 50%;
              width: 30px;
              height: 30px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
              display: none;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">Secure Payment</div>
            <h2>Aashish Jewellers</h2>
            <div class="amount">NPR ${totalAmount.toLocaleString()}</div>

            <div class="details">
              <strong>Order Summary:</strong><br>
              ${pricing.items.map(item => `${escapeHtml(item.name)} x${escapeHtml(String(item.quantity))}`).join('<br>')}
            </div>

            <form id="esewaForm" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
              <input type="hidden" name="amount" value="${amount}" />
              <input type="hidden" name="tax_amount" value="${taxAmount}" />
              <input type="hidden" name="total_amount" value="${totalAmount}" />
              <input type="hidden" name="transaction_uuid" value="${transactionUuid}" />
              <input type="hidden" name="product_code" value="${productCode}" />
              <input type="hidden" name="product_service_charge" value="${productServiceCharge}" />
              <input type="hidden" name="product_delivery_charge" value="${productDeliveryCharge}" />
              <input type="hidden" name="success_url" value="${successUrl}" />
              <input type="hidden" name="failure_url" value="${failureUrl}" />
              <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code" />
              <input type="hidden" name="signature" value="${signature}" />

              <button type="submit" class="btn" onclick="showLoader()">
                Pay with eSewa
              </button>
            </form>

            <div class="loader" id="loader"></div>
            <div class="secure">Your payment is secured by eSewa</div>

            <script>
              function showLoader() {
                document.querySelector('.btn').style.display = 'none';
                document.getElementById('loader').style.display = 'block';
              }

              setTimeout(() => {
                document.getElementById('esewaForm').submit();
              }, 3000);
            </script>
          </div>
        </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(esewaFormHtml);
  } catch (error) {
    if (error instanceof OrderValidationError) {
      return res.status(400).json({
        error: error.message,
        ...(error.details ? { details: error.details } : {}),
      });
    }

    console.error('eSewa payment creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
