// Test endpoint to simulate eSewa form creation without actual payment
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  try {
    console.log('Test eSewa form endpoint called');
    console.log('Method:', req.method);
    console.log('Body:', req.body);
    
    // Mock data for testing
    const mockData = {
      items: [
        { name: 'Test Ring', quantity: 1, price: 5000 },
        { name: 'Test Necklace', quantity: 2, price: 3000 }
      ],
      customer: {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '9800000000'
      },
      total: 11000
    };
    
    // Use request data if provided, otherwise use mock data
    const { items, customer, total } = req.method === 'POST' ? req.body : mockData;
    
    // Generate test transaction
    const transactionUuid = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const amount = total;
    const taxAmount = 0;
    const totalAmount = amount + taxAmount;
    
    // Test configuration
    const productCode = 'EPAYTEST';
    const secretKey = '8gBm/:&EnhH.1/q';
    const baseUrl = req.headers.host ? `http://${req.headers.host}` : 'http://localhost:3000';
    const successUrl = `${baseUrl}/api/test-esewa-success`;
    const failureUrl = `${baseUrl}/api/test-esewa-failure`;
    
    // Generate signature
    const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
    const signature = crypto.createHmac('sha256', secretKey)
                           .update(message)
                           .digest('base64');
    
    console.log('Test payment details:', {
      transactionUuid,
      totalAmount,
      signature,
      successUrl,
      failureUrl
    });
    
    // Return test form HTML
    const testFormHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TEST: eSewa Payment Form</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
              margin: 0; padding: 20px; min-height: 100vh;
            }
            .container { 
              background: white; padding: 30px; border-radius: 15px; 
              box-shadow: 0 10px 30px rgba(0,0,0,0.2); max-width: 600px; margin: 0 auto;
            }
            .test-banner {
              background: #ff6b6b; color: white; padding: 10px; border-radius: 5px;
              text-align: center; font-weight: bold; margin-bottom: 20px;
            }
            .details { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .form-data { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { 
              background: #28a745; color: white; border: none; padding: 15px 30px;
              border-radius: 8px; font-size: 16px; cursor: pointer; margin: 10px;
            }
            .btn-test { background: #ff6b6b; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="test-banner">🧪 TEST MODE - This is a test form, not real payment</div>
            
            <h2>eSewa Payment Test</h2>
            <div class="details">
              <strong>Test Transaction:</strong> ${transactionUuid}<br>
              <strong>Amount:</strong> NPR ${totalAmount.toLocaleString()}<br>
              <strong>Items:</strong> ${items.map(item => `${item.name} x${item.quantity}`).join(', ')}
            </div>

            <div class="form-data">
              <strong>Form Data to be sent to eSewa:</strong>
              <pre>${JSON.stringify({
                amount,
                tax_amount: taxAmount,
                total_amount: totalAmount,
                transaction_uuid: transactionUuid,
                product_code: productCode,
                success_url: successUrl,
                failure_url: failureUrl,
                signature: signature
              }, null, 2)}</pre>
            </div>

            <form action="https://rc-epay.esewa.com.np/api/epay/main/v2/form" method="POST" target="_blank">
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
              
              <button type="submit" class="btn">Test Real eSewa (Opens in new tab)</button>
            </form>

            <button onclick="testSuccess()" class="btn btn-test">Simulate Success</button>
            <button onclick="testFailure()" class="btn btn-test">Simulate Failure</button>
            
            <script>
              function testSuccess() {
                window.location.href = '${successUrl}?data=' + btoa(JSON.stringify({
                  transaction_uuid: '${transactionUuid}',
                  total_amount: '${totalAmount}',
                  signature: '${signature}',
                  signed_field_names: 'total_amount,transaction_uuid,product_code',
                  product_code: '${productCode}'
                }));
              }
              
              function testFailure() {
                window.location.href = '${failureUrl}?error=user_cancelled';
              }
            </script>
          </div>
        </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(testFormHtml);
    
  } catch (error) {
    console.error('Test eSewa form error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
