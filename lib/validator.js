/**
 * Security-focused Input Validation for Jewelry Store
 * Prevents XSS, SQL Injection, and other attacks
 */

// HTML entities that need escaping to prevent XSS
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;'
};

/**
 * Escapes HTML to prevent XSS attacks
 * Like putting jewelry in a secure display case - visible but protected
 */
export function escapeHtml(text) {
  if (!text) return '';
  return String(text).replace(/[&<>"'\/]/g, char => HTML_ENTITIES[char]);
}

/**
 * Validates and sanitizes customer name
 * Only allows letters, spaces, and common punctuation
 */
export function validateCustomerName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }
  
  // Remove extra spaces and trim
  const cleaned = name.trim().replace(/\s+/g, ' ');
  
  // Check length (min 2, max 100 characters)
  if (cleaned.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  if (cleaned.length > 100) {
    return { valid: false, error: 'Name is too long' };
  }
  
  // Only allow letters, spaces, dots, and dashes (covers most names globally)
  const nameRegex = /^[a-zA-Z\s\-\.\']+$/;
  if (!nameRegex.test(cleaned)) {
    return { valid: false, error: 'Name contains invalid characters' };
  }
  
  // Check for potential script injection patterns
  const dangerousPatterns = /<script|javascript:|onclick|onerror|<iframe|<object/i;
  if (dangerousPatterns.test(cleaned)) {
    return { valid: false, error: 'Invalid input detected' };
  }
  
  return { valid: true, value: escapeHtml(cleaned) };
}

/**
 * Validates phone number for Nepal
 * Accepts formats: 98XXXXXXXX, 97XXXXXXXX, etc.
 */
export function validatePhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }
  
  // Remove spaces, dashes, and country code
  const cleaned = phone.replace(/[\s\-\+]/g, '').replace(/^977/, '');
  
  // Nepal mobile numbers: 98/97/96 followed by 8 digits
  const nepalMobileRegex = /^9[6-8]\d{8}$/;
  
  if (!nepalMobileRegex.test(cleaned)) {
    return { valid: false, error: 'Please enter a valid Nepali mobile number' };
  }
  
  return { valid: true, value: cleaned };
}

/**
 * Validates email address
 */
export function validateEmail(email) {
  if (!email) return { valid: true, value: '' }; // Email is optional
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  // Additional check for common typos
  if (email.includes('..') || email.endsWith('.')) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  return { valid: true, value: email.toLowerCase().trim() };
}

/**
 * Validates address fields
 */
export function validateAddress(address) {
  const errors = {};
  
  // Street validation
  if (!address.street || address.street.trim().length < 5) {
    errors.street = 'Street address must be at least 5 characters';
  } else if (address.street.length > 200) {
    errors.street = 'Street address is too long';
  }
  
  // District validation
  if (!address.district || address.district.trim().length < 2) {
    errors.district = 'District is required';
  }
  
  // Sanitize all fields
  const sanitized = {
    street: escapeHtml(address.street?.trim() || ''),
    district: escapeHtml(address.district?.trim() || ''),
    zone: escapeHtml(address.zone?.trim() || ''),
    landmark: escapeHtml(address.landmark?.trim() || '')
  };
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    value: sanitized
  };
}

/**
 * Validates payment amount
 * Prevents negative values, decimals (we use integers for NPR)
 */
export function validateAmount(amount) {
  const numAmount = Number(amount);
  
  if (isNaN(numAmount) || numAmount <= 0) {
    return { valid: false, error: 'Invalid amount' };
  }
  
  // Max transaction limit (10 lakhs NPR)
  if (numAmount > 1000000) {
    return { valid: false, error: 'Amount exceeds transaction limit' };
  }
  
  return { valid: true, value: Math.floor(numAmount) }; // No paisa, only rupees
}

/**
 * Main validation function for complete order
 */
export function validateOrder(order) {
  const errors = {};
  
  // Validate customer info
  const nameValidation = validateCustomerName(order.customer?.name);
  if (!nameValidation.valid) errors.name = nameValidation.error;
  
  const phoneValidation = validatePhoneNumber(order.customer?.phone);
  if (!phoneValidation.valid) errors.phone = phoneValidation.error;
  
  const emailValidation = validateEmail(order.customer?.email);
  if (!emailValidation.valid) errors.email = emailValidation.error;
  
  const addressValidation = validateAddress(order.customer?.address || {});
  if (!addressValidation.valid) {
    Object.assign(errors, addressValidation.errors);
  }
  
  // Validate amount
  const amountValidation = validateAmount(order.total);
  if (!amountValidation.valid) errors.total = amountValidation.error;
  
  // Validate items
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    errors.items = 'No items in order';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: {
      customer: {
        name: nameValidation.value,
        phone: phoneValidation.value,
        email: emailValidation.value,
        address: addressValidation.value
      },
      total: amountValidation.value,
      items: order.items // Already validated in cart
    }
  };
}
