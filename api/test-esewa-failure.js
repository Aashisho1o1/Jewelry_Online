// Test endpoint to simulate eSewa failure callback
module.exports = async function handler(req, res) {
  try {
    console.log('Test eSewa failure endpoint called');
    console.log('Query params:', req.query);
    
    const { error, transaction_uuid } = req.query;
    
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Payment Failed</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px; background: #f8f9fa;
            }
            .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 15px; }
            .failure { color: #dc3545; background: #f8d7da; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .details { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .btn { 
              background: #007bff; color: white; border: none; padding: 10px 20px;
              border-radius: 5px; cursor: pointer; margin: 5px;
            }
            .btn-retry { background: #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="failure">
              <h2>❌ Test Payment Failed</h2>
              <p>This is a test failure page. In production, this would show appropriate error messages and retry options.</p>
            </div>
            
            <div class="details">
              <strong>Error:</strong> ${error || 'Unknown error'}<br>
              ${transaction_uuid ? `<strong>Transaction ID:</strong> ${transaction_uuid}<br>` : ''}
              <strong>Timestamp:</strong> ${new Date().toISOString()}
            </div>
            
            <div class="details">
              <strong>Common reasons for payment failure:</strong>
              <ul>
                <li>Insufficient balance in eSewa account</li>
                <li>User cancelled the payment</li>
                <li>Network connectivity issues</li>
                <li>Invalid payment credentials</li>
                <li>Transaction timeout</li>
              </ul>
            </div>
            
            <button onclick="window.location.href='/checkout'" class="btn btn-retry">Try Again</button>
            <button onclick="window.location.href='/'" class="btn">Go to Homepage</button>
            
            <div style="margin-top: 30px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
              <strong>For Testing:</strong><br>
              • This endpoint simulates payment failures<br>
              • In production, users would be redirected here from eSewa<br>
              • You can customize error messages based on the error parameter
            </div>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Test eSewa failure error:', error);
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
            <button onclick="history.back()">Go Back</button>
          </div>
        </body>
      </html>
    `);
  }
};
