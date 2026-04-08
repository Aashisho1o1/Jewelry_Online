/**
 * Consolidated payments handler — routes by sub-path.
 *
 * POST /api/payments/esewa/create
 * GET  /api/payments/esewa/callback  (also: /esewa/success, /esewa/failure via vercel.json)
 * POST /api/payments/khalti/create
 * GET  /api/payments/khalti/verify
 * POST /api/payments/fonepay/create
 */

import crypto from 'crypto';
import { paymentRateLimit } from '../lib/rate-limiter.js';
import {
  assertSubmittedTotal,
  normalizeAndPriceOrderItems,
  OrderValidationError,
} from '../lib/order-pricing.js';
import { validateOrder } from '../lib/validator.js';
import logger from '../lib/logger.js';

function buildBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl && !vercelUrl.startsWith('http')) return `https://${vercelUrl}`;
  if (vercelUrl) return vercelUrl;
  return 'http://localhost:5000';
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

function getAction(req) {
  const pathname = req.url.split('?')[0];
  const match = pathname.match(/\/payments\/(.+)$/);
  return match ? match[1] : '';
}

export default async function handler(req, res) {
  const action = getAction(req);

  // POST /api/payments/esewa/create
  if (action === 'esewa/create') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const allowed = await paymentRateLimit(req, res);
    if (!allowed) return;
    try {
      const { items, customer, total } = req.body;
      let parsedItems, parsedCustomer;
      try {
        parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
        parsedCustomer = typeof customer === 'string' ? JSON.parse(customer) : customer;
      } catch { return res.status(400).json({ error: 'Invalid data format' }); }
      if (!parsedItems || !Array.isArray(parsedItems) || !parsedCustomer) return res.status(400).json({ error: 'Missing or invalid required fields' });
      if (!parsedCustomer.name || !parsedCustomer.phone) return res.status(400).json({ error: 'Incomplete customer information' });
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
      if (Number.isNaN(amount) || amount <= 0) return res.status(400).json({ error: 'Invalid payment amount' });
      const productCode = process.env.ESEWA_PRODUCT_CODE;
      const secretKey = process.env.ESEWA_SECRET_KEY;
      if (!productCode || !secretKey) return res.status(500).json({ error: 'Payment gateway not configured', message: 'eSewa payment is temporarily unavailable. Please try another payment method.' });
      const baseUrl = buildBaseUrl();
      const successUrl = `${baseUrl}/api/payments/esewa/success`;
      const failureUrl = `${baseUrl}/api/payments/esewa/failure`;
      const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
      const signature = crypto.createHmac('sha256', secretKey).update(message).digest('base64');
      const { createOrder } = await import('../lib/db-store.js');
      await createOrder({ id: transactionUuid, items: pricing.items, customer: parsedCustomer, total: totalAmount, paymentMethod: 'esewa', status: 'pending', paymentDetails: { provider: 'esewa', transactionUuid } });
      const esewaFormHtml = `<!DOCTYPE html><html><head><title>eSewa Payment - Aashish Jewellers</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);margin:0;padding:0;min-height:100vh;display:flex;align-items:center;justify-content:center}.container{background:white;padding:40px;border-radius:15px;box-shadow:0 20px 40px rgba(0,0,0,.1);max-width:400px;width:90%;text-align:center}.logo{font-size:24px;font-weight:bold;color:#333;margin-bottom:20px}.amount{font-size:32px;font-weight:bold;color:#28a745;margin:20px 0}.details{background:#f8f9fa;padding:15px;border-radius:8px;margin:20px 0;text-align:left}.btn{background:#28a745;color:white;border:none;padding:15px 30px;border-radius:8px;font-size:16px;font-weight:bold;cursor:pointer;width:100%;margin-top:20px}.btn:hover{background:#218838}.secure{font-size:12px;color:#666;margin-top:15px}.loader{border:3px solid #f3f3f3;border-top:3px solid #28a745;border-radius:50%;width:30px;height:30px;animation:spin 1s linear infinite;margin:20px auto;display:none}@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}</style></head><body><div class="container"><div class="logo">Secure Payment</div><h2>Aashish Jewellers</h2><div class="amount">NPR ${totalAmount.toLocaleString()}</div><div class="details"><strong>Order Summary:</strong><br>${pricing.items.map(item => `${escapeHtml(item.name)} x${escapeHtml(String(item.quantity))}`).join('<br>')}</div><form id="esewaForm" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST"><input type="hidden" name="amount" value="${amount}"/><input type="hidden" name="tax_amount" value="${taxAmount}"/><input type="hidden" name="total_amount" value="${totalAmount}"/><input type="hidden" name="transaction_uuid" value="${transactionUuid}"/><input type="hidden" name="product_code" value="${productCode}"/><input type="hidden" name="product_service_charge" value="${productServiceCharge}"/><input type="hidden" name="product_delivery_charge" value="${productDeliveryCharge}"/><input type="hidden" name="success_url" value="${successUrl}"/><input type="hidden" name="failure_url" value="${failureUrl}"/><input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code"/><input type="hidden" name="signature" value="${signature}"/><button type="submit" class="btn" onclick="showLoader()">Pay with eSewa</button></form><div class="loader" id="loader"></div><div class="secure">Your payment is secured by eSewa</div><script>function showLoader(){document.querySelector('.btn').style.display='none';document.getElementById('loader').style.display='block';}setTimeout(()=>{document.getElementById('esewaForm').submit();},3000);</script></div></body></html>`;
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(esewaFormHtml);
    } catch (error) {
      if (error instanceof OrderValidationError) return res.status(400).json({ error: error.message, ...(error.details ? { details: error.details } : {}) });
      console.error('eSewa payment creation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/payments/esewa/callback (success & failure)
  if (action === 'esewa/callback' || action === 'esewa/success' || action === 'esewa/failure') {
    try {
      const { data, pid, status } = req.query;
      if (status === 'failed' || (!data && pid)) return res.redirect('/checkout?status=failed&error=payment_cancelled&order=' + (pid || ''));
      if (!data) return res.redirect('/checkout?status=failed&error=no_data');
      let parsedData;
      try { parsedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8')); }
      catch { return res.redirect('/checkout?status=failed&error=invalid_response_format'); }
      if (!parsedData.transaction_uuid || !parsedData.status || !parsedData.signature) return res.redirect('/checkout?status=failed&error=incomplete_response');
      const secretKey = process.env.ESEWA_SECRET_KEY;
      if (!secretKey) return res.redirect('/checkout?status=failed&error=gateway_not_configured');
      if (!parsedData.signed_field_names) return res.redirect('/checkout?status=failed&error=missing_signature_fields');
      const signedFields = parsedData.signed_field_names.split(',');
      const msg = signedFields.map(f => `${f}=${parsedData[f]}`).join(',');
      const expectedSig = crypto.createHmac('sha256', secretKey).update(msg).digest('base64');
      if (Buffer.from(expectedSig).length !== Buffer.from(String(parsedData.signature)).length || !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(String(parsedData.signature)))) {
        console.error('[esewa] Signature verification failed');
        return res.redirect('/checkout?status=failed&error=invalid_signature');
      }
      const { transaction_uuid: transactionUuid, total_amount: totalAmount, transaction_code: transactionCode = 'N/A', status: paymentStatus } = parsedData;
      if (paymentStatus !== 'COMPLETE') return res.redirect(`/checkout?status=failed&error=payment_incomplete&code=${paymentStatus}`);
      const { confirmOrder, getOrderById } = await import('../lib/db-store.js');
      const existingOrder = await getOrderById(transactionUuid);
      if (!existingOrder) return res.redirect('/checkout?status=failed&error=order_not_found');
      await confirmOrder(transactionUuid, { provider: 'esewa', transactionCode, totalAmount });
      const phoneParam = existingOrder.customer?.phone ? `&phone=${encodeURIComponent(existingOrder.customer.phone)}` : '';
      return res.redirect(`/order-success?id=${transactionUuid}&payment=esewa&amount=${totalAmount}&txn=${transactionCode}${phoneParam}`);
    } catch (error) {
      console.error('[esewa] Callback error:', error.message);
      return res.redirect('/checkout?status=failed&error=processing_error');
    }
  }

  // POST /api/payments/khalti/create
  if (action === 'khalti/create') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const allowed = await paymentRateLimit(req, res);
    if (!allowed) return;
    try {
      const { items, customer, total } = req.body;
      if (!items || !customer) return res.status(400).json({ error: 'Missing required fields' });
      if (!customer.name || !customer.phone) return res.status(400).json({ error: 'Incomplete customer information' });
      const pricing = await normalizeAndPriceOrderItems(items);
      assertSubmittedTotal(total, pricing.total);
      const khaltiSecretKey = process.env.KHALTI_SECRET_KEY;
      if (!khaltiSecretKey) return res.status(500).json({ error: 'Payment gateway not configured', message: 'Khalti payment is temporarily unavailable. Please try another payment method.' });
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const amountBreakdown = [{ label: 'Jewelry Items', amount: Math.round(pricing.subtotal * 100) }];
      if (pricing.deliveryFee > 0) amountBreakdown.push({ label: 'Delivery', amount: Math.round(pricing.deliveryFee * 100) });
      const khaltiPayload = { return_url: `${buildBaseUrl()}/api/payments/khalti/verify`, website_url: buildBaseUrl(), amount: Math.round(pricing.total * 100), purchase_order_id: orderId, purchase_order_name: `Aashish Jewellers - Order ${orderId}`, customer_info: { name: customer.name, email: customer.email || `customer-${orderId}@example.com`, phone: customer.phone }, amount_breakdown: amountBreakdown, product_details: pricing.items.map(item => ({ identity: item.id, name: item.name, total_price: Math.round(item.price * item.quantity * 100), quantity: item.quantity, unit_price: Math.round(item.price * 100) })) };
      const khaltiResponse = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', { method: 'POST', headers: { Authorization: `Key ${khaltiSecretKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify(khaltiPayload) });
      const khaltiData = await khaltiResponse.json();
      if (khaltiResponse.ok && khaltiData.payment_url) {
        const { createOrder } = await import('../lib/db-store.js');
        await createOrder({ id: orderId, items: pricing.items, customer, total: pricing.total, paymentMethod: 'khalti', status: 'pending', paymentDetails: { provider: 'khalti', pidx: khaltiData.pidx || null } });
        return res.status(200).json({ success: true, orderId, paymentUrl: khaltiData.payment_url, paymentToken: khaltiData.pidx, total: pricing.total, message: 'Redirecting to Khalti...' });
      }
      let errorMessage = khaltiData.detail || khaltiData.error || 'Failed to initiate Khalti payment';
      return res.status(400).json({ error: errorMessage });
    } catch (error) {
      if (error instanceof OrderValidationError) return res.status(400).json({ error: error.message, ...(error.details ? { details: error.details } : {}) });
      console.error('Khalti payment creation error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/payments/khalti/verify
  if (action === 'khalti/verify') {
    try {
      const { pidx, purchase_order_id, amount } = req.query;
      if (!pidx || !purchase_order_id) return res.redirect('/checkout?status=failed&error=missing_params');
      if (!process.env.KHALTI_SECRET_KEY) return res.redirect(`/checkout?status=failed&error=gateway_not_configured&order=${purchase_order_id}`);
      const verificationResponse = await fetch('https://a.khalti.com/api/v2/epayment/lookup/', { method: 'POST', headers: { Authorization: `Key ${process.env.KHALTI_SECRET_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ pidx }) });
      const verificationData = await verificationResponse.json();
      if (verificationResponse.ok && verificationData.status === 'Completed') {
        const { confirmOrder, getOrderById } = await import('../lib/db-store.js');
        const existingOrder = await getOrderById(purchase_order_id);
        if (!existingOrder) return res.redirect('/checkout?status=failed&error=order_not_found');
        await confirmOrder(purchase_order_id, { provider: 'khalti', pidx, transactionId: verificationData.transaction_id || null });
        const amountNPR = Number(verificationData.total_amount || amount) / 100;
        const phoneParam = existingOrder.customer?.phone ? `&phone=${encodeURIComponent(existingOrder.customer.phone)}` : '';
        return res.redirect(`/order-success?id=${purchase_order_id}&payment=khalti&amount=${amountNPR}&txn=${verificationData.transaction_id}${phoneParam}`);
      }
      const errorMessage = verificationData.detail ? encodeURIComponent(verificationData.detail) : 'verification_failed';
      return res.redirect(`/checkout?status=failed&error=${errorMessage}&order=${purchase_order_id}`);
    } catch (error) {
      console.error('[khalti] Verify error:', error.message);
      return res.redirect('/checkout?status=failed&error=server_error');
    }
  }

  // POST /api/payments/fonepay/create
  if (action === 'fonepay/create') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const allowed = await paymentRateLimit(req, res);
    if (!allowed) return;
    try {
      logger.log('FonePay payment request received');
      const pricing = await normalizeAndPriceOrderItems(req.body?.items);
      assertSubmittedTotal(req.body?.total, pricing.total);
      const validation = validateOrder({ ...req.body, items: pricing.items, total: pricing.total });
      if (!validation.valid) { logger.warn('Invalid order data:', validation.errors); return res.status(400).json({ error: 'Invalid order data', details: validation.errors }); }
      const { customer, items } = validation.sanitizedData;
      const orderId = `FNP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const { createOrder } = await import('../lib/db-store.js');
      const order = await createOrder({ id: orderId, items, customer, total: pricing.total, paymentMethod: 'fonepay', status: 'pending', paymentDetails: { provider: 'fonepay', qrDisplayed: true, awaitingVerification: true, createdAt: new Date().toISOString() } });
      logger.log('FonePay order created:', orderId);
      return res.status(200).json({ success: true, orderId: order.id, qrCodeUrl: '/images/fonepay-qr-code.jpg', paymentInstructions: { amount: pricing.total, reference: orderId, merchantName: 'Aashish Jewellers', instructions: ['Open your FonePay mobile app', 'Scan the QR code displayed', `Enter amount: NPR ${pricing.total.toLocaleString()}`, `Use reference: ${orderId}`, 'Complete the payment', "Click \"I've Paid\" to notify us"] }, message: 'FonePay QR code generated. Please scan and pay.' });
    } catch (error) {
      if (error instanceof OrderValidationError) return res.status(400).json({ error: error.message, ...(error.details ? { details: error.details } : {}) });
      logger.error('FonePay payment creation error:', error);
      return res.status(500).json({ error: 'Internal server error', message: 'Failed to create FonePay payment. Please try again.' });
    }
  }

  return res.status(404).json({ error: 'Unknown payments endpoint' });
}
