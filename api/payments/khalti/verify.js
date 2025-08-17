export default async function handler(req, res) {
  try {
    const { pidx, status, purchase_order_id } = req.query;

    if (!pidx || !purchase_order_id) {
      return res.redirect('/checkout?status=failed&error=missing_params');
    }

    if (status === 'Completed') {
      // Verify payment with Khalti
      try {
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
          console.log(`Khalti payment verified for order ${purchase_order_id}`);
          
          // Update order status in database
          // await updateOrderStatus(purchase_order_id, 'paid');
          
          // Send confirmation
          // await sendPaymentConfirmation(purchase_order_id);

          return res.redirect(`/order-success?id=${purchase_order_id}&payment=khalti`);
        } else {
          console.error('Khalti verification failed:', verificationData);
          return res.redirect('/checkout?status=failed&error=verification_failed');
        }
      } catch (verificationError) {
        console.error('Khalti verification error:', verificationError);
        return res.redirect('/checkout?status=failed&error=verification_error');
      }
    } else {
      console.log(`Khalti payment not completed for order ${purchase_order_id}, status: ${status}`);
      return res.redirect('/checkout?status=failed&error=payment_not_completed');
    }

  } catch (error) {
    console.error('Khalti verify handler error:', error);
    return res.redirect('/checkout?status=failed&error=server_error');
  }
}
