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
    let decodedData, parsedData;
    try {
      decodedData = Buffer.from(data, 'base64').toString('utf-8');
      parsedData = JSON.parse(decodedData);
      
      console.log('eSewa response data:', parsedData);
      console.log('Verifying signature...');
    } catch (parseError) {
      console.error('❌ Failed to decode or parse eSewa data:', parseError);
      console.error('Raw data received:', data);
      return res.redirect('/checkout?status=failed&error=invalid_response_format');
    }
    
    // Validate required fields in the response
    if (!parsedData.transaction_uuid || !parsedData.status || !parsedData.signature) {
      console.error('❌ Missing required fields in eSewa response:', parsedData);
      return res.redirect('/checkout?status=failed&error=incomplete_response');
    }

    // Verify signature (CRITICAL for security)
    try {
      const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';
      
      // Validate that signed_field_names exists
      if (!parsedData.signed_field_names) {
        console.error('❌ Missing signed_field_names in eSewa response');
        return res.redirect('/checkout?status=failed&error=missing_signature_fields');
      }
      
      const signedFields = parsedData.signed_field_names.split(',');
      
      // Validate that all signed fields exist in the response
      const missingFields = signedFields.filter(field => parsedData[field] === undefined);
      if (missingFields.length > 0) {
        console.error('❌ Missing signed fields in eSewa response:', missingFields);
        return res.redirect('/checkout?status=failed&error=missing_required_fields');
      }
      
      // Build the message for signature verification
      const message = signedFields.map(field => `${field}=${parsedData[field]}`).join(',');
      
      // Generate expected signature
      const expectedSignature = crypto.createHmac('sha256', secretKey)
                                     .update(message)
                                     .digest('base64');
  
      // Compare signatures
      if (expectedSignature !== parsedData.signature) {
        console.error('❌ Signature verification failed');
        console.error('Expected:', expectedSignature);
        console.error('Received:', parsedData.signature);
        console.error('Message used for signature:', message);
        return res.redirect('/checkout?status=failed&error=invalid_signature');
      }
      
      console.log('✅ eSewa signature verified successfully');
    } catch (signatureError) {
      console.error('❌ Error during signature verification:', signatureError);
      return res.redirect('/checkout?status=failed&error=signature_verification_error');
    }

    // Payment verified successfully
    const transactionUuid = parsedData.transaction_uuid;
    const totalAmount = parsedData.total_amount;
    const transactionCode = parsedData.transaction_code || 'N/A';
    const status = parsedData.status;
    
    console.log(`✅ eSewa payment verified successfully:`, {
      transactionUuid,
      totalAmount,
      transactionCode,
      status
    });
    
    // Validate payment status
    if (status !== 'COMPLETE') {
      console.error(`❌ eSewa payment status is not COMPLETE: ${status}`);
      return res.redirect(`/checkout?status=failed&error=payment_incomplete&code=${status}`);
    }
    
    // Update order status in our store
    const { updateOrderStatus, getOrderById } = await import('../../../lib/db-store.js');
    
    // Check if order exists
    const existingOrder = getOrderById(transactionUuid);
    if (existingOrder) {
      // Update order status
      updateOrderStatus(transactionUuid, 'confirmed');
      console.log(`✅ Order status updated to confirmed: ${transactionUuid}`);
    } else {
      console.warn(`⚠️ Order not found for transaction: ${transactionUuid}`);
    }
    
    // In production, send confirmation email/SMS
    // await sendPaymentConfirmation(transactionUuid);
    
    // Log successful payment for audit trail
    console.log(`💰 eSewa payment completed successfully at ${new Date().toISOString()}`);
    
    // Redirect to success page with all relevant details
    return res.redirect(`/order-success?id=${transactionUuid}&payment=esewa&amount=${totalAmount}&txn=${transactionCode}`);

  } catch (error) {
    console.error('eSewa success handler error:', error);
    console.error('Error stack:', error.stack);
    return res.redirect('/checkout?status=failed&error=processing_error');
  }
}