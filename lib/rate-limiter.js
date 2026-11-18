/**
 * Simple Rate Limiter for API Protection
 * Like a security guard who only lets in a certain number of customers at a time
 */

// Every limiter keeps its own counts; a shared map let one endpoint's traffic block another.
const allLimiters = [];

/**
 * Cleans up expired entries every 5 minutes
 */
setInterval(() => {
  const now = Date.now();
  for (const requestCounts of allLimiters) {
    for (const [key, data] of requestCounts.entries()) {
      if (now > data.resetTime) requestCounts.delete(key);
    }
  }
}, 300000).unref?.(); // Run every 5 minutes without keeping the process alive

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

  const requestCounts = new Map();
  allLimiters.push(requestCounts);

  return async (req, res) => {
    // First x-forwarded-for entry is the client; the full header varies with proxies
    const clientId = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
                    req.connection?.remoteAddress ||
                    'unknown';

    const now = Date.now();

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
 * 10 payment attempts per minute per IP
 */
export const paymentRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
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
