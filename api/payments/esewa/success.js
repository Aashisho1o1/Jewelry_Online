export default async function handler(req, res) {
  try {
    const { oid, amt, refId } = req.query;

    if (!oid || !amt || !refId) {
      return res.redirect('/checkout?status=failed&error=missing_params');
    }

    // Verify payment with eSewa
    const verificationParams = new URLSearchParams({
      amt: amt,
      scd: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST',
      pid: oid,
      rid: refId,
    });

    const verificationUrl = `https://uat.esewa.com.np/epay/transrec?${verificationParams.toString()}`;
    
    try {
      const response = await fetch(verificationUrl);
      const responseText = await response.text();

      if (responseText.includes('Success')) {
        // Payment verified successfully
        console.log(`Payment verified for order ${oid}, amount: ${amt}, refId: ${refId}`);
        
        // Update order status in database
        // await updateOrderStatus(oid, 'paid');
        
        // Send confirmation email/SMS
        // await sendPaymentConfirmation(oid);

        return res.redirect(`/order-success?id=${oid}&payment=esewa`);
      } else {
        console.error('eSewa verification failed:', responseText);
        return res.redirect('/checkout?status=failed&error=verification_failed');
      }
    } catch (verificationError) {
      console.error('eSewa verification error:', verificationError);
      return res.redirect('/checkout?status=failed&error=verification_error');
    }

  } catch (error) {
    console.error('eSewa success handler error:', error);
    return res.redirect('/checkout?status=failed&error=server_error');
  }
}
