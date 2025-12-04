-- Create orders_status table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders_status (
    order_id INTEGER PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed')),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_status_status ON orders_status(status);
CREATE INDEX IF NOT EXISTS idx_orders_status_completed_at ON orders_status(completed_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_orders_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_orders_status_updated_at ON orders_status;
CREATE TRIGGER trigger_update_orders_status_updated_at
    BEFORE UPDATE ON orders_status
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_status_updated_at();

-- Initialize status for all existing orders from today that don't have a status
INSERT INTO orders_status (order_id, status, completed_at)
SELECT o.id, 'in-progress', NULL
FROM orders o
WHERE DATE(o.timestamp) = CURRENT_DATE
  AND NOT EXISTS (
    SELECT 1 FROM orders_status os WHERE os.order_id = o.id
  )
ON CONFLICT (order_id) DO NOTHING;
