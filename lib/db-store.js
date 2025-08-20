/**
 * Lean database store for jewelry orders
 * Essential functions only - optimized for speed and cost
 */

import { query, queryMany } from './db.js';

/**
 * Create a new order in the database
 * @param {Object} orderData - Order data
 * @returns {Object} Created order
 */
export async function createOrder(orderData) {
  // Generate order ID if not provided
  const id = orderData.id || `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`💎 Creating order: ${id}`);
  
  try {
    const result = await query(
      `INSERT INTO orders (id, items, customer, total, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, items, customer, total, payment_method, status, created_at`,
      [
        id,
        JSON.stringify(orderData.items),
        JSON.stringify(orderData.customer),
        orderData.total,
        orderData.paymentMethod,
        orderData.status || 'pending'
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create order - no result returned');
    }
    
    // Parse JSON fields back to objects for consistency
    const order = {
      ...result,
      items: typeof result.items === 'string' ? JSON.parse(result.items) : result.items,
      customer: typeof result.customer === 'string' ? JSON.parse(result.customer) : result.customer
    };
    
    console.log(`✅ Order saved to database: ${id}`);
    return order;
    
  } catch (error) {
    console.error(`❌ Failed to create order ${id}:`, error);
    throw error;
  }
}

/**
 * Get an order by ID
 * @param {string} orderId - Order ID
 * @returns {Object|null} Order or null if not found
 */
export async function getOrderById(orderId) {
  console.log(`🔍 Fetching order: ${orderId}`);
  
  try {
    const result = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    
    if (!result) {
      console.log(`📭 Order not found: ${orderId}`);
      return null;
    }
    
    // Parse JSON fields back to objects
    const order = {
      ...result,
      items: typeof result.items === 'string' ? JSON.parse(result.items) : result.items,
      customer: typeof result.customer === 'string' ? JSON.parse(result.customer) : result.customer
    };
    
    console.log(`✅ Order found: ${orderId}`);
    return order;
    
  } catch (error) {
    console.error(`❌ Failed to fetch order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Update order status
 * @param {string} orderId - Order ID
 * @param {string} status - New status
 * @returns {Object|null} Updated order or null if not found
 */
export async function updateOrderStatus(orderId, status) {
  console.log(`🔄 Updating order ${orderId} status to: ${status}`);
  
  try {
    const result = await query(
      `UPDATE orders 
       SET status = $1 
       WHERE id = $2 
       RETURNING id, items, customer, total, payment_method, status, created_at`,
      [status, orderId]
    );
    
    if (!result) {
      console.log(`📭 Order not found for status update: ${orderId}`);
      return null;
    }
    
    // Parse JSON fields back to objects
    const order = {
      ...result,
      items: typeof result.items === 'string' ? JSON.parse(result.items) : result.items,
      customer: typeof result.customer === 'string' ? JSON.parse(result.customer) : result.customer
    };
    
    console.log(`✅ Order status updated: ${orderId} -> ${status}`);
    return order;
    
  } catch (error) {
    console.error(`❌ Failed to update order status ${orderId}:`, error);
    throw error;
  }
}

/**
 * Update order with additional data (for payment details)
 * @param {string} orderId - Order ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated order or null if not found
 */
export async function updateOrder(orderId, updates) {
  console.log(`🔄 Updating order ${orderId} with:`, Object.keys(updates));
  
  try {
    // For now, we only support updating payment_details and status
    // This keeps the schema simple and costs low
    const allowedUpdates = {};
    if (updates.status) allowedUpdates.status = updates.status;
    if (updates.paymentDetails) allowedUpdates.payment_details = JSON.stringify(updates.paymentDetails);
    
    if (Object.keys(allowedUpdates).length === 0) {
      console.log(`⚠️ No allowed updates provided for order ${orderId}`);
      return await getOrderById(orderId);
    }
    
    const setClause = Object.keys(allowedUpdates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [orderId, ...Object.values(allowedUpdates)];
    
    const result = await query(
      `UPDATE orders 
       SET ${setClause}
       WHERE id = $1 
       RETURNING id, items, customer, total, payment_method, status, created_at`,
      values
    );
    
    if (!result) {
      console.log(`📭 Order not found for update: ${orderId}`);
      return null;
    }
    
    // Parse JSON fields back to objects
    const order = {
      ...result,
      items: typeof result.items === 'string' ? JSON.parse(result.items) : result.items,
      customer: typeof result.customer === 'string' ? JSON.parse(result.customer) : result.customer
    };
    
    console.log(`✅ Order updated: ${orderId}`);
    return order;
    
  } catch (error) {
    console.error(`❌ Failed to update order ${orderId}:`, error);
    throw error;
  }
}

/**
 * Get basic order statistics for business insights
 * @returns {Object} Order statistics
 */
export async function getOrderStats() {
  console.log('📊 Fetching order statistics...');
  
  try {
    const stats = await queryMany(`
      SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(total), 0) as revenue
      FROM orders 
      GROUP BY status
      ORDER BY status
    `);
    
    const result = stats.reduce((acc, row) => {
      acc[row.status] = { 
        count: parseInt(row.count), 
        revenue: parseFloat(row.revenue) 
      };
      return acc;
    }, {});
    
    console.log('✅ Order statistics fetched:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Failed to fetch order statistics:', error);
    throw error;
  }
}

/**
 * Get recent orders (for admin/debugging)
 * @param {number} limit - Number of orders to fetch (default: 10)
 * @returns {Array} Recent orders
 */
export async function getRecentOrders(limit = 10) {
  console.log(`📋 Fetching ${limit} recent orders...`);
  
  try {
    const orders = await queryMany(
      `SELECT id, customer, total, payment_method, status, created_at 
       FROM orders 
       ORDER BY created_at DESC 
       LIMIT $1`,
      [limit]
    );
    
    // Parse customer JSON for each order
    const parsedOrders = orders.map(order => ({
      ...order,
      customer: typeof order.customer === 'string' ? JSON.parse(order.customer) : order.customer
    }));
    
    console.log(`✅ Fetched ${parsedOrders.length} recent orders`);
    return parsedOrders;
    
  } catch (error) {
    console.error('❌ Failed to fetch recent orders:', error);
    throw error;
  }
}
