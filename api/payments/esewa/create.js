const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('eSewa payment request received');
    console.log('Request method:', req.method);
    console.log('Request body:', req.body);
    
    const { items, customer, total } = req.body;

    // Validate required fields
    if (!items || !customer || !total) {
      console.error('Missing required fields:', { items: !!items, customer: !!customer, total: !!total });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique transaction UUID (eSewa v2 requires UUID format)
    const transactionUuid = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate amounts according to eSewa v2 API
    const amount = total;
    const taxAmount = 0; // No tax for jewelry (you can add tax calculation later)
    const totalAmount = amount + taxAmount;
    
    // eSewa v2 configuration
    const productCode = process.env.ESEWA_PRODUCT_CODE || 'EPAYTEST'; // Test product code
    const secretKey = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q'; // Test secret key
    
    // Success/failure URLs - these are where eSewa will redirect after payment
    const successUrl = `${process.env.VERCEL_URL || 'https://jewelry-online.vercel.app'}/api/payments/esewa/success`;
    const failureUrl = `${process.env.VERCEL_URL || 'https://jewelry-online.vercel.app'}/api/payments/esewa/failure`;

    // Generate HMAC-SHA256 signature (CRITICAL for security)
    // eSewa uses this to verify the request hasn't been tampered with
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = crypto.createHmac('sha256', secretKey)
                           .update(message)
                           .digest('base64');

    // Store order data (in production, save to database)
    const order = {
      transactionUuid,
      items,
      customer,
      total: totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    console.log('eSewa order created:', order);
    console.log('Generated signature:', signature);
    console.log('Success URL:', successUrl);
    console.log('Failure URL:', failureUrl);

    // Create beautiful payment form HTML
    const esewaFormHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>eSewa Payment - Aashish Jewellers</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0; padding: 0; min-height: 100vh;
              display: flex; align-items: center; justify-content: center;
            }
            .container { 
              background: white; padding: 40px; border-radius: 15px; 
              box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 400px; width: 90%;
              text-align: center;
            }
            .logo { font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px; }
            .amount { font-size: 32px; font-weight: bold; color: #28a745; margin: 20px 0; }
            .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left; }
            .btn { 
              background: #28a745; color: white; border: none; padding: 15px 30px;
              border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer;
              width: 100%; margin-top: 20px; transition: background 0.3s;
            }
            .btn:hover { background: #218838; }
            .secure { font-size: 12px; color: #666; margin-top: 15px; }
            .loader { 
              border: 3px solid #f3f3f3; border-top: 3px solid #28a745; 
              border-radius: 50%; width: 30px; height: 30px; 
              animation: spin 1s linear infinite; margin: 20px auto; display: none;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">🔒 Secure Payment</div>
            <h2>Aashish Jewellers</h2>
            <div class="amount">NPR ${totalAmount.toLocaleString()}</div>
            
            <div class="details">
              <strong>Order Summary:</strong><br>
              ${items.map(item => `${item.name} x${item.quantity}`).join('<br>')}
            </div>

            <form id="esewaForm" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST">
              <input type="hidden" name="amount" value="${amount}" />
              <input type="hidden" name="tax_amount" value="${taxAmount}" />
              <input type="hidden" name="total_amount" value="${totalAmount}" />
              <input type="hidden" name="transaction_uuid" value="${transactionUuid}" />
              <input type="hidden" name="product_code" value="${productCode}" />
              <input type="hidden" name="product_service_charge" value="0" />
              <input type="hidden" name="product_delivery_charge" value="0" />
              <input type="hidden" name="success_url" value="${successUrl}" />
              <input type="hidden" name="failure_url" value="${failureUrl}" />
              <input type="hidden" name="signed_field_names" value="total_amount,transaction_uuid,product_code" />
              <input type="hidden" name="signature" value="${signature}" />
              
              <button type="submit" class="btn" onclick="showLoader()">
                Pay with eSewa
              </button>
            </form>

            <div class="loader" id="loader"></div>
            <div class="secure">🔐 Your payment is secured by eSewa</div>
            
            <script>
              function showLoader() {
                document.querySelector('.btn').style.display = 'none';
                document.getElementById('loader').style.display = 'block';
              }
              
              // Auto-submit after 3 seconds for better UX
              setTimeout(() => {
                document.getElementById('esewaForm').submit();
              }, 3000);
            </script>
          </div>
        </body>
      </html>
    `;

    // Return HTML instead of JSON (important for form submission)
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(esewaFormHtml);

  } catch (error) {
    console.error('eSewa payment creation error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}