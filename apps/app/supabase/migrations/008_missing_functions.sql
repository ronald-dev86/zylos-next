-- =========================================================================
-- ZYLOS HYBRID MERGE: MISSING RPC FUNCTIONS (008_missing_functions)
-- Adding missing functions for complete frontend integration
-- =========================================================================

-- Get sale items for a specific sale
CREATE OR REPLACE FUNCTION get_sale_items(p_sale_id UUID)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object('items', (
        SELECT json_agg(json_build_object(
            'id', id,
            'sale_id', sale_id,
            'product_id', product_id,
            'product_name', (SELECT name FROM products WHERE id = sale_items.product_id),
            'quantity', quantity,
            'unit_price', unit_price,
            'total_price', quantity * unit_price,
            'created_at', created_at
        ))
        FROM sale_items
        WHERE sale_id = p_sale_id
        AND EXISTS (
            SELECT 1 FROM sales 
            WHERE sales.id = p_sale_id 
            AND sales.tenant_id = get_current_tenant_id()
        )
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get single sale with items
CREATE OR REPLACE FUNCTION get_sale_by_id(p_sale_id UUID)
RETURNS JSON AS $$
DECLARE
    sale_record RECORD;
BEGIN
    SELECT 
        s.id,
        s.customer_id,
        c.name as customer_name,
        s.subtotal,
        s.tax,
        s.total_amount,
        s.status,
        s.payment_status,
        s.created_at,
        s.updated_at
    INTO sale_record
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    WHERE s.id = p_sale_id 
    AND s.tenant_id = get_current_tenant_id();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Sale not found or access denied';
    END IF;
    
    RETURN json_build_object(
        'sale', sale_record,
        'items', (SELECT COALESCE(json_agg(
            json_build_object(
                'id', si.id,
                'product_id', si.product_id,
                'product_name', p.name,
                'quantity', si.quantity,
                'unit_price', si.unit_price,
                'total_price', si.quantity * si.unit_price,
                'created_at', si.created_at
            )
        ), '[]'::json)
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = p_sale_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create customer with balance
CREATE OR REPLACE FUNCTION create_customer_rpc(
    p_name VARCHAR(100),
    p_email VARCHAR(255),
    p_phone VARCHAR(50),
    p_address TEXT
)
RETURNS JSON AS $$
DECLARE
    customer_id UUID;
    tenant_id UUID;
BEGIN
    tenant_id := get_current_tenant_id();
    
    INSERT INTO customers (tenant_id, name, email, phone, address)
    VALUES (tenant_id, p_name, p_email, p_phone, p_address)
    RETURNING id, created_at INTO customer_id;
    
    RETURN json_build_object(
        'id', customer_id,
        'name', p_name,
        'email', p_email,
        'phone', p_phone,
        'address', p_address,
        'balance', 0,
        'created_at', (SELECT created_at FROM customers WHERE id = customer_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create supplier with balance
CREATE OR REPLACE FUNCTION create_supplier_rpc(
    p_name VARCHAR(100),
    p_email VARCHAR(255),
    p_phone VARCHAR(50),
    p_address TEXT
)
RETURNS JSON AS $$
DECLARE
    supplier_id UUID;
    tenant_id UUID;
BEGIN
    tenant_id := get_current_tenant_id();
    
    INSERT INTO suppliers (tenant_id, name, email, phone, address)
    VALUES (tenant_id, p_name, p_email, p_phone, p_address)
    RETURNING id, created_at INTO supplier_id;
    
    RETURN json_build_object(
        'id', supplier_id,
        'name', p_name,
        'email', p_email,
        'phone', p_phone,
        'address', p_address,
        'balance', 0,
        'created_at', (SELECT created_at FROM suppliers WHERE id = supplier_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create product with stock
CREATE OR REPLACE FUNCTION create_product_rpc(
    p_name VARCHAR(200),
    p_description TEXT,
    p_sku VARCHAR(50),
    p_price DECIMAL(10,2),
    p_initial_stock DECIMAL(10,3) DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    product_id UUID;
    tenant_id UUID;
    movement_id UUID;
BEGIN
    tenant_id := get_current_tenant_id();
    
    -- Create product
    INSERT INTO products (tenant_id, name, description, sku, price)
    VALUES (tenant_id, p_name, p_description, p_sku, p_price)
    RETURNING id, created_at INTO product_id;
    
    -- Record initial stock if provided
    IF p_initial_stock > 0 THEN
        movement_id := create_inventory_movement(
            tenant_id, 
            product_id, 
            'in'::movement_type, 
            p_initial_stock, 
            'Initial stock'
        );
    END IF;
    
    RETURN json_build_object(
        'id', product_id,
        'name', p_name,
        'description', p_description,
        'sku', p_sku,
        'price', p_price,
        'stock', COALESCE(p_initial_stock, 0),
        'created_at', (SELECT created_at FROM products WHERE id = product_id)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_sale_items TO authenticated;
GRANT EXECUTE ON FUNCTION get_sale_by_id TO authenticated;
GRANT EXECUTE ON FUNCTION create_customer_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION create_supplier_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION create_product_rpc TO authenticated;

GRANT EXECUTE ON FUNCTION get_sale_items TO service_role;
GRANT EXECUTE ON FUNCTION get_sale_by_id TO service_role;
GRANT EXECUTE ON FUNCTION create_customer_rpc TO service_role;
GRANT EXECUTE ON FUNCTION create_supplier_rpc TO service_role;
GRANT EXECUTE ON FUNCTION create_product_rpc TO service_role;