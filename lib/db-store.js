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
  
  console.log(`[db-store] Creating order: ${id}`);
  
  try {
    const result = await query(
      `INSERT INTO orders (
         id, items, customer, total, payment_method, status, payment_details, promo_code, discount_amount
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, items, customer, total, payment_method, status, payment_details, promo_code, discount_amount, created_at`,
      [
        id,
        JSON.stringify(orderData.items),
        JSON.stringify(orderData.customer),
        orderData.total,
        orderData.paymentMethod,
        orderData.status || 'pending',
        orderData.paymentDetails ? JSON.stringify(orderData.paymentDetails) : null,
        orderData.promoCode || null,
        Number(orderData.discountAmount || 0),
      ]
    );
    
    if (!result) {
      throw new Error('Failed to create order - no result returned');
    }
    
    // Parse JSON fields back to objects for consistency
    const order = {
      ...result,
      items: typeof result.items === 'string' ? JSON.parse(result.items) : result.items,
      customer: typeof result.customer === 'string' ? JSON.parse(result.customer) : result.customer,
      paymentDetails: typeof result.payment_details === 'string' ? JSON.parse(result.payment_details) : result.payment_details,
      promoCode: result.promo_code || null,
      discountAmount: Number(result.discount_amount || 0),
    };
    
    console.log(`[db-store] Order saved to database: ${id}`);
    return order;
    
  } catch (error) {
    console.error(`[db-store] Failed to create order ${id}:`, error);
    throw error;
  }
}

/**
 * Get an order by ID
 * @param {string} orderId - Order ID
 * @returns {Object|null} Order or null if not found
 */
export async function getOrderById(orderId) {
  console.log(`[db-store] Fetching order: ${orderId}`);
  
  try {
    const result = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    
    if (!result) {
      console.log(`[db-store] Order not found: ${orderId}`);
      return null;
    }
    
    // Parse JSON fields back to objects
    const order = {
      ...result,
      items: typeof result.items === 'string' ? JSON.parse(result.items) : result.items,
      customer: typeof result.customer === 'string' ? JSON.parse(result.customer) : result.customer,
      paymentDetails: typeof result.payment_details === 'string' ? JSON.parse(result.payment_details) : result.payment_details,
      promoCode: result.promo_code || null,
      discountAmount: Number(result.discount_amount || 0),
    };
    
    console.log(`[db-store] Order found: ${orderId}`);
    return order;
    
  } catch (error) {
    console.error(`[db-store] Failed to fetch order ${orderId}:`, error);
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
  console.log(`[db-store] Updating order ${orderId} status to: ${status}`);
  
  try {
    const result = await query(
      `UPDATE orders 
       SET status = $1 
       WHERE id = $2 
       RETURNING id, items, customer, total, payment_method, status, created_at`,
      [status, orderId]
    );
    
    if (!result) {
      console.log(`[db-store] Order not found for status update: ${orderId}`);
      return null;
    }
    
    // Parse JSON fields back to objects
    const order = {
      ...result,
      items: typeof result.items === 'string' ? JSON.parse(result.items) : result.items,
      customer: typeof result.customer === 'string' ? JSON.parse(result.customer) : result.customer
    };
    
    console.log(`[db-store] Order status updated: ${orderId} -> ${status}`);
    return order;
    
  } catch (error) {
    console.error(`[db-store] Failed to update order status ${orderId}:`, error);
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
  console.log(`[db-store] Updating order ${orderId} with:`, Object.keys(updates));
  
  try {
    // For now, we only support updating payment_details and status
    // This keeps the schema simple and costs low
    const allowedUpdates = {};
    if (updates.status) allowedUpdates.status = updates.status;
    if (updates.paymentDetails) allowedUpdates.payment_details = JSON.stringify(updates.paymentDetails);
    
    if (Object.keys(allowedUpdates).length === 0) {
      console.log(`[db-store] No allowed updates provided for order ${orderId}`);
      return await getOrderById(orderId);
    }
    
    const setClause = Object.keys(allowedUpdates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [orderId, ...Object.values(allowedUpdates)];
    
    const result = await query(
      `UPDATE orders 
       SET ${setClause}
       WHERE id = $1 
       RETURNING id, items, customer, total, payment_method, status, payment_details, promo_code, discount_amount, created_at`,
      values
    );
    
    if (!result) {
      console.log(`[db-store] Order not found for update: ${orderId}`);
      return null;
    }
    
    // Parse JSON fields back to objects
    const order = {
      ...result,
      items: typeof result.items === 'string' ? JSON.parse(result.items) : result.items,
      customer: typeof result.customer === 'string' ? JSON.parse(result.customer) : result.customer,
      paymentDetails: typeof result.payment_details === 'string' ? JSON.parse(result.payment_details) : result.payment_details,
      promoCode: result.promo_code || null,
      discountAmount: Number(result.discount_amount || 0),
    };
    
    console.log(`[db-store] Order updated: ${orderId}`);
    return order;
    
  } catch (error) {
    console.error(`[db-store] Failed to update order ${orderId}:`, error);
    throw error;
  }
}

// Closed orders hold no stock and can't be reopened (reopening would need stock taken again).
export const CLOSED_ORDER_STATUSES = new Set(['cancelled', 'refunded', 'failed']);

export class OrderStatusError extends Error {}

// Conditional update: only one concurrent request wins a given transition,
// so stock is never adjusted twice for the same change.
async function claimStatus(orderId, fromStatus, toStatus) {
  return query('UPDATE orders SET status = $1 WHERE id = $2 AND status = $3 RETURNING id', [toStatus, orderId, fromStatus]);
}

// Stock is held by any order that has left 'pending' and isn't closed.
export async function confirmOrder(orderId, paymentDetails = null, targetStatus = 'confirmed') {
  const order = await getOrderById(orderId);
  if (!order) return null;

  const mergedPaymentDetails = paymentDetails
    ? { ...(order.paymentDetails || {}), ...paymentDetails }
    : null;

  // Apply stock and promo usage only when leaving 'pending'; re-confirming a
  // processing/dispatched order must not decrement stock a second time.
  if (order.status === 'pending' && await claimStatus(orderId, 'pending', targetStatus)) {
    if (order.promoCode) {
      await incrementPromoUsage(order.promoCode);
    }

    for (const item of order.items || []) {
      await decrementStock(item.id, item.quantity);
    }
  }

  return updateOrder(orderId, {
    status: targetStatus,
    ...(mergedPaymentDetails ? { paymentDetails: mergedPaymentDetails } : {}),
  });
}

export async function closeOrder(orderId, status) {
  const order = await getOrderById(orderId);
  if (!order) return null;
  if (order.status === status) return order;
  if (CLOSED_ORDER_STATUSES.has(order.status)) {
    throw new OrderStatusError(`Order is already ${order.status} and can't be changed.`);
  }
  if (!await claimStatus(orderId, order.status, status)) {
    throw new OrderStatusError('Order was just changed by someone else. Refresh and try again.');
  }

  // Give back what confirmation took; pending orders never held stock.
  if (order.status !== 'pending') {
    for (const item of order.items || []) {
      await incrementStock(item.id, item.quantity);
    }
    if (order.promoCode) {
      await query('UPDATE promos SET used_count = GREATEST(0, used_count - 1) WHERE UPPER(code) = UPPER($1)', [order.promoCode]);
    }
  }

  return getOrderById(orderId);
}

/**
 * Get basic order statistics for business insights
 * @returns {Object} Order statistics
 */
export async function getOrderStats() {
  console.log('[db-store] Fetching order statistics...');
  
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
    
    console.log('[db-store] Order statistics fetched:', result);
    return result;
    
  } catch (error) {
    console.error('[db-store] Failed to fetch order statistics:', error);
    throw error;
  }
}

// Promo helpers

export async function getPromo(code) {
  return query('SELECT * FROM promos WHERE UPPER(code) = UPPER($1)', [code]);
}

export async function incrementPromoUsage(code) {
  await query(
    'UPDATE promos SET used_count = used_count + 1 WHERE UPPER(code) = UPPER($1)',
    [code]
  );
}

// Inventory helpers

export async function getProductStock(productId) {
  const row = await query('SELECT quantity FROM product_inventory WHERE product_id = $1', [productId]);
  return row ? row.quantity : null;
}

export async function updateProductStock(productId, quantity) {
  await query(
    `INSERT INTO product_inventory (product_id, quantity, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (product_id) DO UPDATE SET quantity = $2, updated_at = NOW()`,
    [productId, quantity]
  );
}

export async function decrementStock(productId, qty) {
  await query(
    `UPDATE product_inventory
     SET quantity = GREATEST(0, quantity - $2), updated_at = NOW()
     WHERE product_id = $1`,
    [productId, qty]
  );
}

export async function incrementStock(productId, qty) {
  await query(
    `UPDATE product_inventory
     SET quantity = quantity + $2, updated_at = NOW()
     WHERE product_id = $1`,
    [productId, qty]
  );
}

export async function getInventory() {
  return queryMany('SELECT product_id, quantity, updated_at FROM product_inventory ORDER BY product_id');
}

// Abandoned cart helpers

export async function getMetalRates() {
  if (!process.env.DATABASE_URL) {
    return [];
  }

  return queryMany(
    `SELECT rate_key, label, price_per_gram, baseline_price_per_gram, source, notes, updated_at
     FROM metal_rates
     ORDER BY rate_key`
  );
}

export async function upsertMetalRate({
  rateKey,
  label,
  pricePerGram,
  baselinePricePerGram,
  source = null,
  notes = null,
}) {
  return query(
    `INSERT INTO metal_rates (
      rate_key,
      label,
      price_per_gram,
      baseline_price_per_gram,
      source,
      notes,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (rate_key) DO UPDATE SET
      label = EXCLUDED.label,
      price_per_gram = EXCLUDED.price_per_gram,
      baseline_price_per_gram = EXCLUDED.baseline_price_per_gram,
      source = EXCLUDED.source,
      notes = EXCLUDED.notes,
      updated_at = NOW()
    RETURNING rate_key, label, price_per_gram, baseline_price_per_gram, source, notes, updated_at`,
    [rateKey, label, pricePerGram, baselinePricePerGram, source, notes]
  );
}

export async function saveAbandonedCart({ id, name, phone, items, subtotal }) {
  if (phone) {
    await query(
      `INSERT INTO abandoned_carts (id, name, phone, items, subtotal)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (phone) DO UPDATE
         SET id = $1, name = $2, items = $4, subtotal = $5, created_at = NOW(), recovered = FALSE`,
      [id, name || null, phone, JSON.stringify(items), subtotal]
    );
  } else {
    await query(
      `INSERT INTO abandoned_carts (id, name, phone, items, subtotal)
       VALUES ($1, $2, NULL, $3, $4)`,
      [id, name || null, JSON.stringify(items), subtotal]
    );
  }
}

export async function getAbandonedCarts(days = 14) {
  return queryMany(
    `SELECT id, name, phone, items, subtotal, created_at, recovered
     FROM abandoned_carts
     WHERE created_at >= NOW() - ($1 || ' days')::INTERVAL
     ORDER BY created_at DESC`,
    [days]
  );
}

export async function markCartRecovered(id) {
  await query('UPDATE abandoned_carts SET recovered = TRUE WHERE id = $1', [id]);
}

// Product CMS helpers

export async function getDbProducts() {
  return queryMany('SELECT * FROM products ORDER BY created_at DESC');
}

export async function getDbProduct(id) {
  return query('SELECT * FROM products WHERE id = $1', [id]);
}

const PRODUCT_COLUMNS = [
  'name', 'category', 'material', 'price', 'original_price', 'description', 'care_instructions', 'weight', 'dimensions',
  'in_stock', 'is_new', 'featured', 'images', 'tags', 'status', 'price_mode', 'wastage_percent', 'making_charge',
  'making_charge_type', 'stone_cost', 'pricing_weight_grams', 'price_base_rate',
];

// images is JSONB: pg would send a plain array as a Postgres array, which JSONB rejects.
const productValues = row => PRODUCT_COLUMNS.map(column => (column === 'images' ? JSON.stringify(row.images) : row[column] ?? null));

export async function insertDbProduct(id, row) {
  return query(
    `INSERT INTO products (id, ${PRODUCT_COLUMNS.join(', ')})
     VALUES ($1, ${PRODUCT_COLUMNS.map((_, i) => `$${i + 2}`).join(', ')}) RETURNING *`,
    [id, ...productValues(row)]
  );
}

export async function saveDbProduct(id, row) {
  return query(
    `UPDATE products SET ${PRODUCT_COLUMNS.map((column, i) => `${column} = $${i + 2}`).join(', ')}, updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id, ...productValues(row)]
  );
}

// Flash sale helpers

export async function getActiveFlashSale() {
  return query(
    `SELECT * FROM flash_sales WHERE is_active = true AND ends_at > NOW() ORDER BY created_at DESC LIMIT 1`
  );
}

export async function upsertFlashSale({ title, subtitle, discount_percent, ends_at }) {
  await queryMany(`UPDATE flash_sales SET is_active = false WHERE is_active = true`);
  return query(
    `INSERT INTO flash_sales (title, subtitle, discount_percent, ends_at)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [title, subtitle || null, discount_percent, ends_at]
  );
}

export async function deactivateFlashSale() {
  await queryMany(`UPDATE flash_sales SET is_active = false WHERE is_active = true`);
}

/**
 * Get recent orders (for admin/debugging)
 * @param {number} limit - Number of orders to fetch (default: 10)
 * @returns {Array} Recent orders
 */
export async function getRecentOrders(limit = 10) {
  console.log(`[db-store] Fetching ${limit} recent orders...`);
  
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
    
    console.log(`[db-store] Fetched ${parsedOrders.length} recent orders`);
    return parsedOrders;
    
  } catch (error) {
    console.error('[db-store] Failed to fetch recent orders:', error);
    throw error;
  }
}
