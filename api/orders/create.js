import { createOrder } from '../../lib/db-store';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🛒 Order creation request received');
    const { items, customer, total, paymentMethod } = req.body;

    // Validate required fields
    if (!items || !customer || !total || !paymentMethod) {
      console.error('❌ Missing required fields in order request');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate customer info
    if (!customer.name || !customer.phone || !customer.address?.street || !customer.address?.district) {
      console.error('❌ Incomplete customer information');
      return res.status(400).json({ error: 'Incomplete customer information' });
    }

    // Create order object
    const orderData = {
      items,
      customer,
      total,
      paymentMethod,
      status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
    };

    // Save order to store
    const order = createOrder(orderData);
    console.log('✅ New order created:', order.id);

    // You could also send an email/SMS notification here
    // await sendOrderConfirmation(order);

    return res.status(200).json({
      success: true,
      orderId: order.id,
      message: paymentMethod === 'cod' 
        ? 'Order placed successfully! We will call you to confirm.'
        : 'Order created successfully!',
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
