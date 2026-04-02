import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    const { data, pid, status } = req.query;

    if (status === 'failed' || (!data && pid)) {
      return res.redirect('/checkout?status=failed&error=payment_cancelled&order=' + (pid || ''));
    }

    if (!data) {
      return res.redirect('/checkout?status=failed&error=no_data');
    }

    let parsedData;
    try {
      parsedData = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'));
    } catch {
      return res.redirect('/checkout?status=failed&error=invalid_response_format');
    }

    if (!parsedData.transaction_uuid || !parsedData.status || !parsedData.signature) {
      return res.redirect('/checkout?status=failed&error=incomplete_response');
    }

    const secretKey = process.env.ESEWA_SECRET_KEY;
    if (!secretKey) {
      return res.redirect('/checkout?status=failed&error=gateway_not_configured');
    }

    if (!parsedData.signed_field_names) {
      return res.redirect('/checkout?status=failed&error=missing_signature_fields');
    }

    const signedFields = parsedData.signed_field_names.split(',');
    const message = signedFields.map(f => `${f}=${parsedData[f]}`).join(',');
    const expectedSignature = crypto.createHmac('sha256', secretKey).update(message).digest('base64');
    const expectedBuffer = Buffer.from(expectedSignature);
    const receivedBuffer = Buffer.from(String(parsedData.signature));

    if (
      expectedBuffer.length !== receivedBuffer.length
      || !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      console.error('[esewa] Signature verification failed');
      return res.redirect('/checkout?status=failed&error=invalid_signature');
    }

    const { transaction_uuid: transactionUuid, total_amount: totalAmount, transaction_code: transactionCode = 'N/A', status: paymentStatus } = parsedData;

    if (paymentStatus !== 'COMPLETE') {
      return res.redirect(`/checkout?status=failed&error=payment_incomplete&code=${paymentStatus}`);
    }

    const { confirmOrder, getOrderById } = await import('../../../lib/db-store.js');
    const existingOrder = await getOrderById(transactionUuid);
    if (!existingOrder) {
      return res.redirect('/checkout?status=failed&error=order_not_found');
    }

    await confirmOrder(transactionUuid, {
      provider: 'esewa',
      transactionCode,
      totalAmount,
    });

    const phoneParam = existingOrder.customer?.phone
      ? `&phone=${encodeURIComponent(existingOrder.customer.phone)}`
      : '';
    return res.redirect(`/order-success?id=${transactionUuid}&payment=esewa&amount=${totalAmount}&txn=${transactionCode}${phoneParam}`);

  } catch (error) {
    console.error('[esewa] Callback error:', error.message);
    return res.redirect('/checkout?status=failed&error=processing_error');
  }
}
