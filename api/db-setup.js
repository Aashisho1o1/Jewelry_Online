/**
 * Database setup and testing endpoint
 * Run this once to create the schema and test connection
 */

import { query, testConnection } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST to setup database.' });
  }

  try {
    console.log('🚀 Starting database setup...');

    // Test connection first
    const connectionTest = await testConnection();
    if (!connectionTest) {
      throw new Error('Database connection failed');
    }

    // Create orders table if it doesn't exist
    console.log('📋 Creating orders table...');
    await query(`
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

    // Create index for performance
    console.log('🔍 Creating performance index...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_orders_status_date 
      ON orders(status, created_at)
    `);

    // Test insert and select
    console.log('🧪 Testing database operations...');
    const testOrder = {
      id: 'TEST-' + Date.now(),
      items: JSON.stringify([{ name: 'Test Ring', price: 1000, quantity: 1 }]),
      customer: JSON.stringify({ name: 'Test Customer', phone: '9876543210' }),
      total: 1000,
      payment_method: 'test',
      status: 'pending'
    };

    // Insert test order
    const insertResult = await query(
      `INSERT INTO orders (id, items, customer, total, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [testOrder.id, testOrder.items, testOrder.customer, testOrder.total, testOrder.payment_method, testOrder.status]
    );

    // Fetch test order
    const fetchResult = await query('SELECT * FROM orders WHERE id = $1', [testOrder.id]);

    // Clean up test order
    await query('DELETE FROM orders WHERE id = $1', [testOrder.id]);

    console.log('✅ Database setup completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'Database setup completed successfully',
      tests: {
        connection: true,
        tableCreation: true,
        indexCreation: true,
        insert: !!insertResult,
        select: !!fetchResult,
        cleanup: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Database setup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
