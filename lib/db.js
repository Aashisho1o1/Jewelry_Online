/**
 * Minimal database connection for Railway PostgreSQL
 * Optimized for cost and simplicity - perfect for fast shipping
 */

import { Pool } from 'pg';

let pool;
let schemaInitialized = false;

/**
 * Initialize database schema (runs once automatically)
 */
async function initializeSchema() {
  if (schemaInitialized) return;
  
  try {
    console.log('🏗️ Initializing database schema...');
    
    // Ensure pool exists before using it
    if (!pool) {
      console.error('❌ Pool not initialized during schema creation');
      return;
    }
    
    // Create orders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        items JSONB NOT NULL,
        customer JSONB NOT NULL,
        total NUMERIC NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    
    // Create performance index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status_date 
      ON orders(status, created_at)
    `);
    
    schemaInitialized = true;
    console.log('✅ Database schema initialized successfully');
    
  } catch (error) {
    console.error('❌ Schema initialization failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    
    // Reset flag so we can try again on next operation
    schemaInitialized = false;
    
    // Don't throw - let the app continue, but log the issue clearly
    console.error('⚠️ Database operations may fail until schema is created manually');
  }
}

/**
 * Initialize database pool (called lazily on first query)
 */
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Railway requires SSL
      max: 5, // Minimal connections to save costs
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('💥 Database pool error:', err);
    });

    console.log('✅ Database pool created (max 5 connections)');
  }
  return pool;
}

/**
 * Execute a query and return single result
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object|null} Single row or null
 */
export async function query(text, params) {
  const pool = getPool();
  
  // Initialize schema on first database operation
  await initializeSchema();
  
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log(`📊 Query executed in ${duration}ms - ${res.rowCount} rows affected`);
    return res.rows[0] || null;
  } catch (error) {
    console.error('❌ Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Execute a query and return multiple results
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Array} Array of rows
 */
export async function queryMany(text, params) {
  const pool = getPool();
  
  // Initialize schema on first database operation
  await initializeSchema();
  
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log(`📊 Query executed in ${duration}ms - ${res.rowCount} rows returned`);
    return res.rows;
  } catch (error) {
    console.error('❌ Database query error:', error);
    console.error('Query:', text);
    console.error('Params:', params);
    throw error;
  }
}

/**
 * Test database connection
 * @returns {boolean} Connection status
 */
export async function testConnection() {
  try {
    const result = await query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful:', result.current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
