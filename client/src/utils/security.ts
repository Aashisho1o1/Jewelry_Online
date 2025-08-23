/**
 * Client-side Security Utilities
 * Protects against XSS and other client-side attacks
 */

/**
 * Escapes HTML entities to prevent XSS
 * Use this before displaying any user input
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Validates and sanitizes user input in real-time
 * Returns sanitized value or null if invalid
 */
export function sanitizeInput(value: string, type: 'name' | 'phone' | 'address'): string | null {
  if (!value) return null;
  
  // Remove any HTML tags
  const stripped = value.replace(/<[^>]*>/g, '');
  
  switch (type) {
    case 'name':
      // Only allow letters, spaces, dots, dashes
      const nameRegex = /^[a-zA-Z\s\-\.\']{2,100}$/;
      return nameRegex.test(stripped) ? stripped : null;
      
    case 'phone':
      // Nepal phone numbers
      const phoneRegex = /^(\+?977)?[9][6-8]\d{8}$/;
      const cleaned = stripped.replace(/[\s\-]/g, '');
      return phoneRegex.test(cleaned) ? cleaned : null;
      
    case 'address':
      // Allow alphanumeric, spaces, common punctuation
      const addressRegex = /^[a-zA-Z0-9\s\-\.,#\/]{5,200}$/;
      return addressRegex.test(stripped) ? stripped : null;
      
    default:
      return stripped;
  }
}

/**
 * Prevents form submission if Enter is pressed in single-line inputs
 * Useful for preventing accidental form submission
 */
export function preventEnterSubmit(event: React.KeyboardEvent): void {
  if (event.key === 'Enter' && event.target instanceof HTMLInputElement) {
    event.preventDefault();
  }
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formats phone number for display
 * 9812345678 -> 98-1234-5678
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Debounce function to prevent rapid API calls
 * Like a bouncer who makes people wait between entries
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
