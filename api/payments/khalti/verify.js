export default async function handler(req, res) {
  try {
    const { pidx, purchase_order_id, amount } = req.query;

    if (!pidx || !purchase_order_id) {
      return res.redirect('/checkout?status=failed&error=missing_params');
    }

    if (!process.env.KHALTI_SECRET_KEY) {
      return res.redirect(`/checkout?status=failed&error=gateway_not_configured&order=${purchase_order_id}`);
    }

    const verificationResponse = await fetch('https://a.khalti.com/api/v2/epayment/lookup/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pidx }),
    });

    const verificationData = await verificationResponse.json();

    if (verificationResponse.ok && verificationData.status === 'Completed') {
      const { confirmOrder, getOrderById } = await import('../../../lib/db-store.js');
      const existingOrder = await getOrderById(purchase_order_id);
      if (!existingOrder) {
        return res.redirect('/checkout?status=failed&error=order_not_found');
      }

      await confirmOrder(purchase_order_id, {
        provider: 'khalti',
        pidx,
        transactionId: verificationData.transaction_id || null,
      });

      const amountNPR = Number(verificationData.total_amount || amount) / 100;
      const phoneParam = existingOrder.customer?.phone
        ? `&phone=${encodeURIComponent(existingOrder.customer.phone)}`
        : '';
      return res.redirect(`/order-success?id=${purchase_order_id}&payment=khalti&amount=${amountNPR}&txn=${verificationData.transaction_id}${phoneParam}`);
    }

    const errorMessage = verificationData.detail ? encodeURIComponent(verificationData.detail) : 'verification_failed';
    return res.redirect(`/checkout?status=failed&error=${errorMessage}&order=${purchase_order_id}`);

  } catch (error) {
    console.error('[khalti] Verify error:', error.message);
    return res.redirect('/checkout?status=failed&error=server_error');
  }
}
