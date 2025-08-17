export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, customer, total } = req.body;

    // Validate required fields
    if (!items || !customer || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order in database
    const order = {
      id: orderId,
      items,
      customer,
      total,
      paymentMethod: 'khalti',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    console.log('Khalti order created:', order);

    // Khalti payment initiation
    const khaltiPayload = {
      return_url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/payments/khalti/verify`,
      website_url: process.env.VERCEL_URL || 'http://localhost:3000',
      amount: total * 100, // Khalti expects amount in paisa (1 NPR = 100 paisa)
      purchase_order_id: orderId,
      purchase_order_name: `Order ${orderId}`,
      customer_info: {
        name: customer.name,
        email: customer.email || 'customer@example.com',
        phone: customer.phone,
      },
    };

    const khaltiResponse = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(khaltiPayload),
    });

    const khaltiData = await khaltiResponse.json();

    if (khaltiResponse.ok && khaltiData.payment_url) {
      return res.status(200).json({
        success: true,
        orderId,
        paymentUrl: khaltiData.payment_url,
        paymentToken: khaltiData.pidx,
        message: 'Redirecting to Khalti...',
      });
    } else {
      console.error('Khalti payment initiation failed:', khaltiData);
      return res.status(400).json({ 
        error: 'Failed to initiate Khalti payment',
        details: khaltiData 
      });
    }

  } catch (error) {
    console.error('Khalti payment creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
