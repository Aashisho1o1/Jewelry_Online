// Simple test endpoint without crypto dependency
module.exports = async function handler(req, res) {
  try {
    console.log('Simple test endpoint called');
    console.log('Method:', req.method);
    console.log('Headers:', req.headers);
    
    return res.status(200).json({
      success: true,
      message: 'Simple test successful',
      method: req.method,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'unknown'
    });
    
  } catch (error) {
    console.error('Simple test error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};
