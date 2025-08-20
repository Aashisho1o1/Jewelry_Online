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

    // Import order store
    const { createOrder } = await import('../../../lib/db-store.js');
    
    // Create order in our store
    const order = await createOrder({
      id: orderId,
      items,
      customer,
      total,
      paymentMethod: 'khalti',
      status: 'pending',
      paymentDetails: {
        provider: 'khalti'
      }
    });

    console.log('✅ Khalti order created:', orderId);

    // Build base URL with proper protocol
    const buildBaseUrl = () => {
      const vercelUrl = process.env.VERCEL_URL;
      
      // If VERCEL_URL exists but doesn't start with http, add https://
      if (vercelUrl && !vercelUrl.startsWith('http')) {
        return `https://${vercelUrl}`;
      }
      
      // If VERCEL_URL already has protocol, use as-is
      if (vercelUrl) {
        return vercelUrl;
      }
      
      // Fallback to hardcoded URL
      return 'https://jewelry-online.vercel.app';
    };

    const baseUrl = buildBaseUrl();
    
    // Khalti payment initiation with proper URLs
    const khaltiPayload = {
      return_url: `${baseUrl}/api/payments/khalti/verify`,
      website_url: baseUrl,
      amount: Math.round(total * 100), // Khalti expects amount in paisa (1 NPR = 100 paisa)
      purchase_order_id: orderId,
      purchase_order_name: `Aashish Jewellers - Order ${orderId}`,
      customer_info: {
        name: customer.name,
        email: customer.email || `customer-${orderId}@example.com`,
        phone: customer.phone,
      },
      amount_breakdown: [
        {
          label: "Jewelry Items",
          amount: Math.round(total * 100)
        }
      ],
      product_details: items.map(item => ({
        identity: item.id,
        name: item.name,
        total_price: Math.round(item.price * item.quantity * 100),
        quantity: item.quantity,
        unit_price: Math.round(item.price * 100)
      }))
    };

    // Log the request for debugging
    console.log('Khalti API request payload:', {
      url: 'https://a.khalti.com/api/v2/epayment/initiate/',
      method: 'POST',
      headers: {
        'Authorization': 'Key ********', // Masked for security
        'Content-Type': 'application/json',
      },
      payload: {
        ...khaltiPayload,
        // Mask sensitive data
        customer_info: {
          ...khaltiPayload.customer_info,
          phone: '******' + khaltiPayload.customer_info.phone.slice(-4),
        }
      }
    });

    try {
      const khaltiResponse = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.KHALTI_SECRET_KEY || 'test_secret_key_f59e8b7d18b4499ca40f68195a846e9b'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(khaltiPayload),
      });

      const khaltiData = await khaltiResponse.json();
      console.log('Khalti API response:', {
        status: khaltiResponse.status,
        statusText: khaltiResponse.statusText,
        data: khaltiData
      });

      if (khaltiResponse.ok && khaltiData.payment_url) {
        console.log(`✅ Khalti payment initiated successfully for order ${orderId}`);
        
        // Store order details for later verification
        // In production, save this to a database
        // For now, we'll rely on Khalti's verification
        
        return res.status(200).json({
          success: true,
          orderId,
          paymentUrl: khaltiData.payment_url,
          paymentToken: khaltiData.pidx,
          message: 'Redirecting to Khalti...',
        });
      } else {
        console.error('❌ Khalti payment initiation failed:', khaltiData);
        
        // Provide more detailed error information
        let errorMessage = 'Failed to initiate Khalti payment';
        if (khaltiData.detail) {
          errorMessage = khaltiData.detail;
        } else if (khaltiData.error) {
          errorMessage = khaltiData.error;
        }
        
        return res.status(400).json({ 
          error: errorMessage,
          details: khaltiData 
        });
      }
    } catch (apiError) {
      console.error('❌ Khalti API request failed:', apiError);
      return res.status(500).json({ 
        error: 'Failed to connect to Khalti payment service',
        message: apiError.message
      });
    }

  } catch (error) {
    console.error('Khalti payment creation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
