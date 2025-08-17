export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { items, customer, total, paymentMethod } = req.body;

    // Validate required fields
    if (!items || !customer || !total) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create order in database (you would implement this)
    const order = {
      id: orderId,
      items,
      customer,
      total,
      paymentMethod: 'esewa',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    console.log('eSewa order created:', order);

    // eSewa configuration
    const esewaConfig = {
      amt: total,
      txAmt: 0, // Tax amount
      psc: 0,   // Service charge
      pdc: 0,   // Delivery charge
      tAmt: total, // Total amount
      pid: orderId, // Product ID (our order ID)
      scd: process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST', // Merchant code
      su: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/payments/esewa/success`,
      fu: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/payments/esewa/failure`,
    };

    // Create eSewa payment URL
    const esewaUrl = 'https://uat.esewa.com.np/epay/main'; // Use production URL for live
    const params = new URLSearchParams(esewaConfig);
    const paymentUrl = `${esewaUrl}?${params.toString()}`;

    return res.status(200).json({
      success: true,
      orderId,
      paymentUrl,
      message: 'Redirecting to eSewa...',
    });

  } catch (error) {
    console.error('eSewa payment creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
