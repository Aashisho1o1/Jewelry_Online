import crypto from 'crypto';

export default async function handler(req, res) {
  try {
    console.log('eSewa success callback received');
    console.log('Query params:', req.query);
    
    const { data } = req.query;
    
    if (!data) {
      console.error('No data received from eSewa');
      return res.redirect('/checkout?status=failed&error=no_data');
    }

    // Decode the base64 data from eSewa
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    const parsedData = JSON.parse(decodedData);
    
    console.log('eSewa response data:', parsedData);
    console.log('Verifying signature...');

    // Verify signature (CRITICAL for security)
    const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
    const signedFields = parsedData.signed_field_names.split(',');
    const message = signedFields.map(field => `${field}=${parsedData[field]}`).join(',');
    
    const expectedSignature = crypto.createHmac('sha256', secretKey)
                                   .update(message)
                                   .digest('base64');

    if (expectedSignature !== parsedData.signature) {
      console.error('Signature verification failed');
      console.error('Expected:', expectedSignature);
      console.error('Received:', parsedData.signature);
      return res.redirect('/checkout?status=failed&error=invalid_signature');
    }

    // Payment verified successfully
    const transactionUuid = parsedData.transaction_uuid;
    const totalAmount = parsedData.total_amount;
    
    console.log(`eSewa payment verified successfully: ${transactionUuid}, amount: ${totalAmount}`);
    
    // In production, update order status in database
    // await updateOrderStatus(transactionUuid, 'paid');
    
    // Send confirmation email/SMS
    // await sendPaymentConfirmation(transactionUuid);
    
    // Redirect to success page
    return res.redirect(`/order-success?id=${transactionUuid}&payment=esewa&amount=${totalAmount}`);

  } catch (error) {
    console.error('eSewa success handler error:', error);
    console.error('Error stack:', error.stack);
    return res.redirect('/checkout?status=failed&error=processing_error');
  }
}