-- Test business functions with real data

-- Test calculate_stock function for Laptop Pro (should be 48: 50 in - 2 out)
SELECT 
    p.name as product_name,
    p.sku,
    calculate_stock(p.id, p.tenant_id) as current_stock
FROM products p 
WHERE p.sku = 'LAPTOP-001';

-- Test calculate_stock for Wireless Mouse (should be 95: 100 in - 5 out)
SELECT 
    p.name as product_name,
    p.sku,
    calculate_stock(p.id, p.tenant_id) as current_stock
FROM products p 
WHERE p.sku = 'MOUSE-001';

-- Test get_customer_balance for John Doe (should be 2599.98)
SELECT 
    c.name as customer_name,
    c.email,
    get_customer_balance(c.id, c.tenant_id) as current_balance
FROM customers c 
WHERE c.email = 'john@example.com';

-- Test get_customer_balance for Jane Smith (should be 149.95)
SELECT 
    c.name as customer_name,
    c.email,
    get_customer_balance(c.id, c.tenant_id) as current_balance
FROM customers c 
WHERE c.email = 'jane@example.com';

-- Test get_supplier_balance for Tech Wholesale (should be 50000.00)
SELECT 
    s.name as supplier_name,
    s.email,
    get_supplier_balance(s.id, s.tenant_id) as current_balance
FROM suppliers s 
WHERE s.email = 'orders@techwholesale.com';