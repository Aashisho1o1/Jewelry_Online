export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, customer, total, paymentMethod } = req.body;

    // Validate required fields
    if (!items || !customer || !total || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate customer info
    if (!customer.name || !customer.phone || !customer.address?.street || !customer.address?.district) {
      return res.status(400).json({ error: 'Incomplete customer information' });
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order object
    const order = {
      id: orderId,
      items,
      customer,
      total,
      paymentMethod,
      status: paymentMethod === 'cod' ? 'confirmed' : 'pending',
      createdAt: new Date().toISOString(),
    };

    // In a real app, you would save this to a database
    // For now, we'll just log it and return success
    console.log('New order created:', order);

    // You could also send an email/SMS notification here
    // await sendOrderConfirmation(order);

    return res.status(200).json({
      success: true,
      orderId,
      message: paymentMethod === 'cod' 
        ? 'Order placed successfully! We will call you to confirm.'
        : 'Order created successfully!',
    });

  } catch (error) {
    console.error('Order creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
