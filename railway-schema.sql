-- Manual schema creation for Railway PostgreSQL
-- Run this in Railway's PostgreSQL console if auto-creation fails

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  items JSONB NOT NULL,
  customer JSONB NOT NULL,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create performance index
CREATE INDEX IF NOT EXISTS idx_orders_status_date 
ON orders(status, created_at);

-- Verify table creation
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Test insert (optional)
-- INSERT INTO orders (id, items, customer, total, payment_method, status) 
-- VALUES (
--   'TEST-001', 
--   '[{"name":"Test Ring","price":1000,"quantity":1}]'::jsonb,
--   '{"name":"Test Customer","phone":"9876543210"}'::jsonb,
--   1000,
--   'test',
--   'pending'
-- );

-- Clean up test data (optional)
-- DELETE FROM orders WHERE id = 'TEST-001';
