// Test endpoint to verify crypto functionality
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  try {
    console.log('Test crypto endpoint called');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    
    // Test basic crypto functionality
    const testMessage = 'total_amount=1000,transaction_uuid=TEST-123,product_code=EPAYTEST';
    const testSecretKey = '8gBm/:&EnhH.1/q';
    
    const signature = crypto.createHmac('sha256', testSecretKey)
                           .update(testMessage)
                           .digest('base64');
    
    // Test environment variables
    const envVars = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      ESEWA_PRODUCT_CODE: process.env.ESEWA_PRODUCT_CODE || 'NOT_SET',
      ESEWA_SECRET_KEY: process.env.ESEWA_SECRET_KEY ? 'SET' : 'NOT_SET'
    };
    
    return res.status(200).json({
      success: true,
      message: 'Crypto test successful',
      testSignature: signature,
      environment: envVars,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version
    });
    
  } catch (error) {
    console.error('Test crypto error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
