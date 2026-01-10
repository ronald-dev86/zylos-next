-- =========================================================================
-- ZYLOS HYBRID MERGE: SEED DATA (007_seed_data)
-- Taking seed data from migrations
-- =========================================================================

-- Insert sample tenant
INSERT INTO tenants (id, name, subdomain, active) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'Demo Store', 'demo', true);

-- Insert sample users
INSERT INTO users (id, email, tenant_id, role) VALUES 
('123e4567-e89b-12d3-a456-426614174001', 'admin@demo.zylos.com', '123e4567-e89b-12d3-a456-426614174000', 'admin'),
('123e4567-e89b-12d3-a456-426614174002', 'vendedor@demo.zylos.com', '123e4567-e89b-12d3-a456-426614174000', 'vendedor'),
('123e4567-e89b-12d3-a456-426614174003', 'contador@demo.zylos.com', '123e4567-e89b-12d3-a456-426614174000', 'contador');

-- Insert sample categories (if categories table exists)
-- INSERT INTO categories (id, tenant_id, name) VALUES 
-- ('cat-1', '123e4567-e89b-12d3-a456-426614174000', 'Electronics'),
-- ('cat-2', '123e4567-e89b-12d3-a456-426614174000', 'Clothing'),
-- ('cat-3', '123e4567-e89b-12d3-a456-426614174000', 'Food');

-- Insert sample products
INSERT INTO products (id, tenant_id, name, description, sku, price) VALUES 
('prod-1', '123e4567-e89b-12d3-a456-426614174000', 'Laptop Pro 15"', 'High-performance laptop', 'LAPTOP-001', 1299.99),
('prod-2', '123e4567-e89b-12d3-a456-426614174000', 'Wireless Mouse', 'Ergonomic wireless mouse', 'MOUSE-001', 29.99),
('prod-3', '123e4567-e89b-12d3-a456-426614174000', 'Mechanical Keyboard', 'RGB mechanical keyboard', 'KEYBOARD-001', 89.99),
('prod-4', '123e4567-e89b-12d3-a456-426614174000', 'Monitor 27"', '4K IPS monitor', 'MONITOR-001', 399.99),
('prod-5', '123e4567-e89b-12d3-a456-426614174000', 'USB-C Hub', '7-in-1 USB hub', 'HUB-001', 49.99);

-- Insert sample inventory movements
INSERT INTO inventory_movements (id, tenant_id, product_id, type, quantity, reason) VALUES 
('mov-1', '123e4567-e89b-12d3-a456-426614174000', 'prod-1', 'in', 10, 'Initial stock'),
('mov-2', '123e4567-e89b-12d3-a456-426614174000', 'prod-2', 'in', 50, 'Initial stock'),
('mov-3', '123e4567-e89b-12d3-a456-426614174000', 'prod-3', 'in', 25, 'Initial stock'),
('mov-4', '123e4567-e89b-12d3-a456-426614174000', 'prod-4', 'in', 15, 'Initial stock'),
('mov-5', '123e4567-e89b-12d3-a456-426614174000', 'prod-5', 'in', 40, 'Initial stock');

-- Insert sample customers
INSERT INTO customers (id, tenant_id, name, email, phone, address) VALUES 
('cust-1', '123e4567-e89b-12d3-a456-426614174000', 'John Doe', 'john@example.com', '555-0101', '123 Main St, City, State 12345'),
('cust-2', '123e4567-e89b-12d3-a456-426614174000', 'Jane Smith', 'jane@example.com', '555-0102', '456 Oak Ave, City, State 12345'),
('cust-3', '123e4567-e89b-12d3-a456-426614174000', 'Bob Johnson', 'bob@example.com', '555-0103', '789 Pine Rd, City, State 12345');

-- Insert sample suppliers
INSERT INTO suppliers (id, tenant_id, name, email, phone, address) VALUES 
('sup-1', '123e4567-e89b-12d3-a456-426614174000', 'Tech Supplier Inc', 'orders@techsupplier.com', '555-0201', '456 Supplier Blvd, Industrial City, State 67890'),
('sup-2', '123e4567-e89b-12d3-a456-426614174000', 'Hardware Pro', 'sales@hardwarepro.com', '555-0202', '789 Hardware Way, Tech Park, State 67890'),
('sup-3', '123e4567-e89b-12d3-a456-426614174000', 'Component World', 'info@componentworld.com', '555-0203', '321 Component Dr, Electronics City, State 67890');