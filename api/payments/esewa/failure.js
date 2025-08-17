export default async function handler(req, res) {
  try {
    const { pid } = req.query; // Order ID

    console.log(`eSewa payment failed for order: ${pid}`);
    
    // Update order status to failed
    // await updateOrderStatus(pid, 'payment_failed');
    
    // Redirect back to checkout with error
    return res.redirect('/checkout?status=failed&error=payment_cancelled&order=' + (pid || ''));

  } catch (error) {
    console.error('eSewa failure handler error:', error);
    return res.redirect('/checkout?status=failed&error=server_error');
  }
}
