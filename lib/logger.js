/**
 * Secure Logger Utility
 * Only logs in development, sanitizes sensitive data in production
 */

const isDevelopment = process.env.NODE_ENV === 'development';

// List of sensitive keys to redact
const SENSITIVE_KEYS = [
  'password', 'token', 'secret', 'key', 'authorization', 
  'cookie', 'session', 'credit', 'card', 'cvv', 'pin',
  'client_id', 'client_secret', 'api_key'
];

/**
 * Sanitizes object by redacting sensitive values
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive data
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Secure logger that only logs in development
 */
export const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args.map(arg => 
        typeof arg === 'object' ? sanitizeObject(arg) : arg
      ));
    }
  },
  
  error: (...args) => {
    // Always log errors, but sanitize in production
    if (isDevelopment) {
      console.error(...args);
    } else {
      console.error(...args.map(arg => 
        typeof arg === 'object' ? sanitizeObject(arg) : arg
      ));
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  }
};

export default logger;
