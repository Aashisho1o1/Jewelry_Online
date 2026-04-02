/**
 * Minimal database connection for Railway PostgreSQL
 * Optimized for cost and simplicity - perfect for fast shipping
 */

import { Pool } from 'pg';
import { DEFAULT_METAL_RATES } from './metal-pricing.js';

let pool;
let schemaInitialized = false;

function buildPoolConfig() {
  const url = process.env.DATABASE_URL;
  const isLocal = !url || url.includes('localhost') || url.includes('127.0.0.1');
  return {
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
}

/**
 * Initialize database schema (runs once automatically)
 */
async function initializeSchema() {
  if (schemaInitialized) return;
  
  try {
    console.log('[db] Initializing database schema...');
    
    // Ensure pool exists before using it
    if (!pool) {
      console.error('[db] Pool not initialized during schema creation');
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
        payment_details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add payment_details column if table already exists without it
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_details JSONB
    `);

    // Add notes column for internal admin notes
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT
    `);

    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code TEXT
    `);

    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0
    `);
    
    // Create performance index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status_date
      ON orders(status, created_at)
    `);

    // Create reviews table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        product_id TEXT NOT NULL,
        author_name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        title TEXT,
        body TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_product
        ON reviews(product_id, created_at DESC)
    `);

    // Create promos table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promos (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        description TEXT,
        discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
        discount_value NUMERIC NOT NULL,
        min_order_amount NUMERIC DEFAULT 0,
        max_uses INTEGER,
        used_count INTEGER DEFAULT 0,
        expires_at TIMESTAMPTZ,
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create product inventory table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_inventory (
        product_id TEXT PRIMARY KEY,
        quantity   INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create metal rates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS metal_rates (
        rate_key TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        price_per_gram NUMERIC NOT NULL DEFAULT 0,
        baseline_price_per_gram NUMERIC NOT NULL DEFAULT 0,
        source TEXT,
        notes TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    for (const rate of DEFAULT_METAL_RATES) {
      await pool.query(
        `INSERT INTO metal_rates (
          rate_key,
          label,
          price_per_gram,
          baseline_price_per_gram,
          source,
          notes
        )
        VALUES ($1, $2, 0, 0, NULL, NULL)
        ON CONFLICT (rate_key) DO NOTHING`,
        [rate.rateKey, rate.label]
      );
    }

    // Create abandoned carts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS abandoned_carts (
        id TEXT PRIMARY KEY,
        name TEXT,
        phone TEXT,
        items JSONB NOT NULL,
        subtotal NUMERIC NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        recovered BOOLEAN DEFAULT FALSE
      )
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_abandoned_carts_phone
        ON abandoned_carts(phone) WHERE phone IS NOT NULL
    `);

    // Create flash sales table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS flash_sales (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        subtitle TEXT,
        discount_percent NUMERIC NOT NULL CHECK (discount_percent > 0 AND discount_percent < 100),
        ends_at TIMESTAMPTZ NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create products table (DB-managed catalog entries)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        material TEXT NOT NULL,
        price NUMERIC NOT NULL,
        original_price NUMERIC,
        description TEXT,
        care_instructions TEXT,
        weight TEXT,
        dimensions TEXT,
        in_stock BOOLEAN DEFAULT TRUE,
        is_new BOOLEAN DEFAULT FALSE,
        images JSONB DEFAULT '[]',
        tags TEXT[] DEFAULT '{}',
        price_source TEXT DEFAULT 'fixed',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    schemaInitialized = true;
    console.log('[db] Database schema initialized successfully');
    
  } catch (error) {
    console.error('[db] Schema initialization failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    
    // Reset flag so we can try again on next operation
    schemaInitialized = false;
    
    // Don't throw - let the app continue, but log the issue clearly
    console.error('[db] Database operations may fail until schema is created manually');
  }
}

/**
 * Execute a query and return single result
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object|null} Single row or null
 */
export async function query(text, params) {
  if (!process.env.DATABASE_URL) return null;

  if (!pool) {
    pool = new Pool(buildPoolConfig());

    pool.on('error', (err) => {
      console.error('[db] Database pool error:', err);
    });

    console.log('[db] Database pool created (max 5 connections)');
  }
  
  // Initialize schema on first database operation
  await initializeSchema();
  
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log(`[db] Query executed in ${duration}ms - ${res.rowCount} rows affected`);
    return res.rows[0] || null;
  } catch (error) {
    console.error('[db] Database query error:', error.message);
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
  if (!process.env.DATABASE_URL) return [];

  if (!pool) {
    pool = new Pool(buildPoolConfig());

    pool.on('error', (err) => {
      console.error('[db] Database pool error:', err);
    });

    console.log('[db] Database pool created (max 5 connections)');
  }
  
  // Initialize schema on first database operation
  await initializeSchema();
  
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    console.log(`[db] Query executed in ${duration}ms - ${res.rowCount} rows returned`);
    return res.rows;
  } catch (error) {
    console.error('[db] Database query error:', error.message);
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
    console.log('[db] Database connection successful:', result.current_time);
    return true;
  } catch (error) {
    console.error('[db] Database connection failed:', error);
    return false;
  }
}
