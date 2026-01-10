-- Seed data for development and testing

-- Create test tenants
INSERT INTO tenants (id, name, subdomain) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Demo Store', 'demo'),
('550e8400-e29b-41d4-a716-446655440002', 'Test Restaurant', 'test'),
('550e8400-e29b-41d4-a716-446655440003', 'Sample Shop', 'sample');

-- Create test users
INSERT INTO users (id, email, tenant_id, role) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'admin@demo.com', '550e8400-e29b-41d4-a716-446655440001', 'admin'),
('650e8400-e29b-41d4-a716-446655440002', 'vendedor@demo.com', '550e8400-e29b-41d4-a716-446655440001', 'vendedor'),
('650e8400-e29b-41d4-a716-446655440003', 'contador@demo.com', '550e8400-e29b-41d4-a716-446655440001', 'contador'),
('650e8400-e29b-41d4-a716-446655440004', 'admin@test.com', '550e8400-e29b-41d4-a716-446655440002', 'admin');

-- Create test products for demo tenant
INSERT INTO products (id, tenant_id, name, description, sku, price) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Laptop Pro', 'High-performance laptop for professionals', 'LAPTOP-001', 1299.99),
('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Wireless Mouse', 'Ergonomic wireless mouse', 'MOUSE-001', 29.99),
('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Mechanical Keyboard', 'RGB mechanical keyboard', 'KEYBOARD-001', 89.99),
('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'USB-C Hub', '7-in-1 USB-C hub', 'HUB-001', 49.99);

-- Create test customers for demo tenant
INSERT INTO customers (id, tenant_id, name, email, phone, address) VALUES
('850e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'John Doe', 'john@example.com', '+1234567890', '123 Main St, City, State'),
('850e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Jane Smith', 'jane@example.com', '+0987654321', '456 Oak Ave, City, State'),
('850e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Acme Corporation', 'contact@acme.com', '+1122334455', '789 Business Blvd, City, State');

-- Create test suppliers for demo tenant
INSERT INTO suppliers (id, tenant_id, name, email, phone, address) VALUES
('950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Tech Wholesale', 'orders@techwholesale.com', '+5551234567', '100 Supplier Way, City, State'),
('950e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Office Supplies Inc', 'sales@officesupplies.com', '+5559876543', '200 Depot Road, City, State');

-- Create initial inventory movements (stock intake)
INSERT INTO inventory_movements (id, tenant_id, product_id, type, quantity, reason) VALUES
('a50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'in', 50, 'Initial stock'),
('a50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', 'in', 100, 'Initial stock'),
('a50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440003', 'in', 75, 'Initial stock'),
('a50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440004', 'in', 150, 'Initial stock');

-- Create some sample sales (inventory out movements)
INSERT INTO inventory_movements (id, tenant_id, product_id, type, quantity, reason, reference_id) VALUES
('b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'out', 2, 'Sale to customer', '850e8400-e29b-41d4-a716-446655440001'),
('b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', 'out', 5, 'Sale to customer', '850e8400-e29b-41d4-a716-446655440002');

-- Create ledger entries for customer credits (sales on credit)
INSERT INTO ledger_entries (id, tenant_id, entity_type, entity_id, type, amount, description) VALUES
('c50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'customer', '850e8400-e29b-41d4-a716-446655440001', 'credit', 2599.98, 'Sale of 2 Laptop Pro units'),
('c50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'customer', '850e8400-e29b-41d4-a716-446655440002', 'credit', 149.95, 'Sale of 5 Wireless Mouse units');

-- Create ledger entries for supplier debts (purchases on credit)
INSERT INTO ledger_entries (id, tenant_id, entity_type, entity_id, type, amount, description) VALUES
('d50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'supplier', '950e8400-e29b-41d4-a716-446655440001', 'debit', 50000.00, 'Bulk purchase of electronics'),
('d50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'supplier', '950e8400-e29b-41d4-a716-446655440002', 'debit', 2000.00, 'Office supplies purchase');