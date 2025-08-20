export default async function handler(req, res) {
  try {
    console.log('🔍 Khalti verification callback received');
    console.log('Query params:', req.query);
    
    const { pidx, status, purchase_order_id, amount } = req.query;

    if (!pidx || !purchase_order_id) {
      console.error('❌ Missing required parameters in Khalti callback');
      return res.redirect('/checkout?status=failed&error=missing_params');
    }

    console.log(`Khalti payment status: ${status} for order ${purchase_order_id}`);
    
    // Always verify the payment with Khalti regardless of the status
    // This is more secure than trusting the status parameter in the URL
    try {
      console.log(`🔄 Verifying Khalti payment with pidx: ${pidx}`);
      
      const verificationResponse = await fetch('https://a.khalti.com/api/v2/epayment/lookup/', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY || 'test_secret_key_f59e8b7d18b4499ca40f68195a846e9b'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx }),
      });

      const verificationData = await verificationResponse.json();
      console.log('Khalti verification response:', {
        status: verificationResponse.status,
        data: verificationData
      });

      if (verificationResponse.ok && verificationData.status === 'Completed') {
        console.log(`✅ Khalti payment verified successfully for order ${purchase_order_id}`);
        console.log('Payment details:', {
          amount: verificationData.total_amount,
          transaction_id: verificationData.transaction_id,
          status: verificationData.status
        });
        
        // Update order status in our store
        const { updateOrderStatus, getOrderById } = await import('../../../lib/order-store');
        
        // Check if order exists
        const existingOrder = getOrderById(purchase_order_id);
        if (existingOrder) {
          // Update order status
          updateOrderStatus(purchase_order_id, 'confirmed');
          console.log(`✅ Order status updated to confirmed: ${purchase_order_id}`);
          
          // Update payment details
          const { updateOrder } = await import('../../../lib/order-store');
          updateOrder(purchase_order_id, {
            paymentDetails: {
              ...existingOrder.paymentDetails,
              transactionId: verificationData.transaction_id,
              amount: verificationData.total_amount,
              verifiedAt: new Date().toISOString()
            }
          });
        } else {
          console.warn(`⚠️ Order not found for transaction: ${purchase_order_id}`);
        }
        
        // In production, send confirmation email/SMS
        // await sendPaymentConfirmation(purchase_order_id);
        
        // Clear the pending order from localStorage (frontend will handle this)
        
        // Redirect to success page with payment details
        const amountNPR = parseInt(amount) / 100; // Convert from paisa to NPR
        return res.redirect(`/order-success?id=${purchase_order_id}&payment=khalti&amount=${amountNPR}&txn=${verificationData.transaction_id}`);
      } else {
        // Payment verification failed
        console.error('❌ Khalti verification failed:', verificationData);
        
        let errorMessage = 'verification_failed';
        if (verificationData.detail) {
          errorMessage = encodeURIComponent(verificationData.detail);
        }
        
        return res.redirect(`/checkout?status=failed&error=${errorMessage}&order=${purchase_order_id}`);
      }
    } catch (verificationError) {
      console.error('❌ Khalti verification error:', verificationError);
      return res.redirect(`/checkout?status=failed&error=verification_error&order=${purchase_order_id}`);
    }
  } catch (error) {
    console.error('❌ Khalti verify handler error:', error);
    console.error('Error stack:', error.stack);
    return res.redirect('/checkout?status=failed&error=server_error');
  }
}
