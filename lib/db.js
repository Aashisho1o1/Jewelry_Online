/**
 * Minimal database connection for Railway PostgreSQL
 * Optimized for cost and simplicity - perfect for fast shipping
 */

import { Pool } from 'pg';

let pool;

/**
 * Execute a query and return single result
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Object|null} Single row or null
 */
export async function query(text, params) {
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
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('💥 Database pool error:', err);
    });

    console.log('✅ Database pool created (max 5 connections)');
  }
  
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
