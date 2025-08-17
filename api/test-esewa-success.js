// Test endpoint to simulate eSewa success callback
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  try {
    console.log('Test eSewa success endpoint called');
    console.log('Query params:', req.query);
    
    const { data, error } = req.query;
    
    if (error) {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Payment Failed</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
              .error { color: #dc3545; background: #f8d7da; padding: 20px; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>❌ Test Payment Failed</h2>
              <p>Error: ${error}</p>
              <button onclick="history.back()">Go Back</button>
            </div>
          </body>
        </html>
      `);
    }
    
    if (!data) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Error</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
              .error { color: #dc3545; background: #f8d7da; padding: 20px; border-radius: 8px; }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>⚠️ No Data Received</h2>
              <p>This is a test endpoint. No payment data was received.</p>
              <button onclick="history.back()">Go Back</button>
            </div>
          </body>
        </html>
      `);
    }
    
    // Decode and parse the data
    const decodedData = Buffer.from(data, 'base64').toString('utf-8');
    const parsedData = JSON.parse(decodedData);
    
    console.log('Decoded test data:', parsedData);
    
    // Verify signature
    const secretKey = '8gBm/:&EnhH.1/q';
    const signedFields = parsedData.signed_field_names.split(',');
    const message = signedFields.map(field => `${field}=${parsedData[field]}`).join(',');
    
    const expectedSignature = crypto.createHmac('sha256', secretKey)
                                   .update(message)
                                   .digest('base64');
    
    const signatureValid = expectedSignature === parsedData.signature;
    
    console.log('Signature verification:', {
      expected: expectedSignature,
      received: parsedData.signature,
      valid: signatureValid
    });
    
    // Return test success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Payment Success</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px; background: #f8f9fa;
            }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; }
            .success { color: #28a745; background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .details { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .signature { background: ${signatureValid ? '#d4edda' : '#f8d7da'}; padding: 15px; border-radius: 8px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
            .btn { 
              background: #007bff; color: white; border: none; padding: 10px 20px;
              border-radius: 5px; cursor: pointer; margin: 5px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">
              <h2>✅ Test Payment Success</h2>
              <p>This is a test success page. In production, this would redirect to your order success page.</p>
            </div>
            
            <div class="details">
              <strong>Transaction ID:</strong> ${parsedData.transaction_uuid}<br>
              <strong>Amount:</strong> NPR ${parsedData.total_amount}<br>
              <strong>Product Code:</strong> ${parsedData.product_code}
            </div>
            
            <div class="signature">
              <strong>Signature Verification:</strong> ${signatureValid ? '✅ Valid' : '❌ Invalid'}<br>
              <strong>Expected:</strong> ${expectedSignature}<br>
              <strong>Received:</strong> ${parsedData.signature}
            </div>
            
            <div class="details">
              <strong>Full Response Data:</strong>
              <pre>${JSON.stringify(parsedData, null, 2)}</pre>
            </div>
            
            <button onclick="window.location.href='/'" class="btn">Go to Homepage</button>
            <button onclick="window.location.href='/checkout'" class="btn">New Order</button>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Test eSewa success error:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
            .error { color: #dc3545; background: #f8d7da; padding: 20px; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>💥 Test Error</h2>
            <p>Error: ${error.message}</p>
            <pre>${error.stack}</pre>
            <button onclick="history.back()">Go Back</button>
          </div>
        </body>
      </html>
    `);
  }
};
