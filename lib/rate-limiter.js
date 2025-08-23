/**
 * Simple Rate Limiter for API Protection
 * Like a security guard who only lets in a certain number of customers at a time
 */

// Store request counts in memory (use Redis in production)
const requestCounts = new Map();

/**
 * Cleans up old entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now - data.resetTime > 60000) { // Remove entries older than 1 minute
      requestCounts.delete(key);
    }
  }
}, 300000); // Run every 5 minutes

/**
 * Rate limiting middleware
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 1 minute)
 * @param {number} options.max - Max requests per window (default: 10)
 * @param {string} options.message - Error message
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 60000, // 1 minute
    max = 10, // 10 requests per minute
    message = 'Too many requests. Please try again later.'
  } = options;

  return async (req, res) => {
    // Get client identifier (IP address or user ID)
    const clientId = req.headers['x-forwarded-for'] || 
                    req.connection?.remoteAddress || 
                    'unknown';
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get or create client data
    let clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      // New window or expired window
      clientData = {
        count: 1,
        resetTime: now + windowMs
      };
      requestCounts.set(clientId, clientData);
      return true; // Allow request
    }
    
    // Increment counter
    clientData.count++;
    
    // Check if limit exceeded
    if (clientData.count > max) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message,
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000) // seconds
      });
      return false; // Block request
    }
    
    return true; // Allow request
  };
}

/**
 * Payment-specific rate limiter
 * Temporarily lenient for testing: 50 payment attempts per 1 minute
 */
export const paymentRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 50, // Much higher limit for testing
  message: 'Too many payment attempts. Please wait 1 minute before trying again.'
});

/**
 * General API rate limiter
 * Less strict: 100 requests per minute
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many requests. Please slow down.'
});
