/**
 * Simple in-memory order store for development
 * In production, replace this with a proper database
 */

// In-memory store (will reset on server restart)
let orders = [];

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Object} Created order
 */
export function createOrder(orderData) {
  // Generate order ID if not provided
  if (!orderData.id) {
    orderData.id = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Add timestamp if not provided
  if (!orderData.createdAt) {
    orderData.createdAt = new Date().toISOString();
  }
  
  // Add to store
  orders.push(orderData);
  
  console.log(`✅ Order created: ${orderData.id}`);
  return orderData;
}

/**
 * Get an order by ID
 * @param {string} orderId - Order ID
 * @returns {Object|null} Order or null if not found
 */
export function getOrderById(orderId) {
  return orders.find(order => order.id === orderId) || null;
}

/**
 * Update an order
 * @param {string} orderId - Order ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated order or null if not found
 */
export function updateOrder(orderId, updates) {
  const index = orders.findIndex(order => order.id === orderId);
  if (index === -1) return null;
  
  // Update order
  orders[index] = {
    ...orders[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  console.log(`✅ Order updated: ${orderId}`);
  return orders[index];
}

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {Object|null} Updated order or null if not found
 */
export function updateOrderStatus(orderId, status) {
  return updateOrder(orderId, { status });
}

/**
 * Get all orders
 * @returns {Array} All orders
 */
export function getAllOrders() {
  return [...orders];
}

/**
 * Get orders by status
 * @param {string} status - Order status
 * @returns {Array} Matching orders
 */
export function getOrdersByStatus(status) {
  return orders.filter(order => order.status === status);
}

/**
 * Get orders by customer phone
 * @param {string} phone - Customer phone number
 * @returns {Array} Matching orders
 */
export function getOrdersByCustomerPhone(phone) {
  return orders.filter(order => order.customer && order.customer.phone === phone);
}

/**
 * Delete an order (for testing only)
 * @param {string} orderId - Order ID
 * @returns {boolean} Success
 */
export function deleteOrder(orderId) {
  const initialLength = orders.length;
  orders = orders.filter(order => order.id !== orderId);
  const deleted = orders.length < initialLength;
  
  if (deleted) {
    console.log(`✅ Order deleted: ${orderId}`);
  }
  
  return deleted;
}
