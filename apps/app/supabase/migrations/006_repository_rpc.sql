-- =========================================================================
-- ZYLOS HYBRID MERGE: REPOSITORY RPC FUNCTIONS (006_repository_rpc)
-- Taking repository pattern functions from migrations with enhanced logic
-- =========================================================================

-- ========================================
-- Inventory Movement Functions
-- ========================================

-- Create inventory movement (matches SupabaseInventoryMovementRepository.create)
CREATE OR REPLACE FUNCTION create_inventory_movement_rpc(
    p_product_id UUID,
    p_type TEXT, -- 'in', 'out', 'adjustment'
    p_quantity DECIMAL(10,3),
    p_reason TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    movement_id UUID;
    current_stock DECIMAL(10,3);
    tenant_id UUID;
BEGIN
    -- Get current tenant_id from JWT
    tenant_id := get_current_tenant_id();
    
    -- Validate movement type
    IF p_type NOT IN ('in', 'out', 'adjustment') THEN
        RAISE EXCEPTION 'Invalid movement type: %', p_type;
    END IF;
    
    -- Validate sufficient stock for outgoing movements
    IF p_type = 'out' THEN
        current_stock := calculate_current_stock(tenant_id, p_product_id);
        IF current_stock < p_quantity THEN
            RAISE EXCEPTION 'Insufficient stock. Current: %, Required: %', current_stock, p_quantity;
        END IF;
    END IF;
    
    -- Create inventory movement
    INSERT INTO inventory_movements (tenant_id, product_id, type, quantity, reason, reference_id)
    VALUES (tenant_id, p_product_id, p_type::movement_type, p_quantity, p_reason, p_reference_id)
    RETURNING id, created_at INTO movement_id;
    
    -- Return JSON response matching TypeScript interface
    RETURN json_build_object('id', movement_id, 'created_at', (SELECT created_at FROM inventory_movements WHERE id = movement_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate current stock (matches SupabaseInventoryMovementRepository.calculateCurrentStock)
CREATE OR REPLACE FUNCTION calculate_current_stock_rpc(p_product_id UUID)
RETURNS JSON AS $$
DECLARE
    stock_amount DECIMAL(10,3);
    tenant_id UUID;
BEGIN
    tenant_id := get_current_tenant_id();
    stock_amount := calculate_current_stock(tenant_id, p_product_id);
    
    RETURN json_build_object('stock', stock_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tenant products (repository pattern)
CREATE OR REPLACE FUNCTION get_tenant_products()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object('products', (
        SELECT json_agg(json_build_object(
            'id', id,
            'name', name,
            'description', description,
            'sku', sku,
            'price', price,
            'stock', calculate_current_stock(get_current_tenant_id(), id),
            'created_at', created_at,
            'updated_at', updated_at
        ))
        FROM products
        WHERE tenant_id = get_current_tenant_id()
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Ledger Entry Functions
-- ========================================

-- Create ledger entry (matches SupabaseLedgerEntryRepository.create)
CREATE OR REPLACE FUNCTION create_ledger_entry_rpc(
    p_entity_type TEXT, -- 'customer', 'supplier'
    p_entity_id UUID,
    p_type TEXT, -- 'credit', 'debit'
    p_amount DECIMAL(15,2),
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    ledger_id UUID;
    tenant_id UUID;
BEGIN
    tenant_id := get_current_tenant_id();
    
    -- Validate entity type
    IF p_entity_type NOT IN ('customer', 'supplier') THEN
        RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
    END IF;
    
    -- Validate ledger type
    IF p_type NOT IN ('credit', 'debit') THEN
        RAISE EXCEPTION 'Invalid ledger type: %', p_type;
    END IF;
    
    -- Create ledger entry
    INSERT INTO ledger_entries (tenant_id, entity_type, entity_id, type, amount, description, reference_id)
    VALUES (tenant_id, p_entity_type::entity_type, p_entity_id, p_type::ledger_type, p_amount, p_description, p_reference_id)
    RETURNING id, created_at INTO ledger_id;
    
    -- Return JSON response matching TypeScript interface
    RETURN json_build_object('id', ledger_id, 'created_at', (SELECT created_at FROM ledger_entries WHERE id = ledger_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate entity balance (matches SupabaseLedgerEntryRepository.calculateEntityBalance)
CREATE OR REPLACE FUNCTION calculate_entity_balance_rpc(
    p_entity_type TEXT, -- 'customer', 'supplier'
    p_entity_id UUID
)
RETURNS JSON AS $$
DECLARE
    balance_amount DECIMAL(15,2);
    tenant_id UUID;
BEGIN
    tenant_id := get_current_tenant_id();
    
    IF p_entity_type = 'customer' THEN
        balance_amount := calculate_entity_balance(tenant_id, 'customer'::entity_type, p_entity_id);
    ELSIF p_entity_type = 'supplier' THEN
        balance_amount := calculate_entity_balance(tenant_id, 'supplier'::entity_type, p_entity_id);
    ELSE
        RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
    END IF;
    
    RETURN json_build_object('balance', balance_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tenant customers (repository pattern)
CREATE OR REPLACE FUNCTION get_tenant_customers()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object('customers', (
        SELECT json_agg(json_build_object(
            'id', id,
            'name', name,
            'email', email,
            'phone', phone,
            'address', address,
            'balance', calculate_entity_balance(get_current_tenant_id(), 'customer'::entity_type, id),
            'created_at', created_at,
            'updated_at', updated_at
        ))
        FROM customers
        WHERE tenant_id = get_current_tenant_id()
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get tenant suppliers (repository pattern)
CREATE OR REPLACE FUNCTION get_tenant_suppliers()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object('suppliers', (
        SELECT json_agg(json_build_object(
            'id', id,
            'name', name,
            'email', email,
            'phone', phone,
            'address', address,
            'balance', calculate_entity_balance(get_current_tenant_id(), 'supplier'::entity_type, id),
            'created_at', created_at,
            'updated_at', updated_at
        ))
        FROM suppliers
        WHERE tenant_id = get_current_tenant_id()
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Sales Functions
-- ========================================

-- Create sale transaction (enhanced version matching SupabaseSaleRepository.create)
CREATE OR REPLACE FUNCTION create_sale_transaction_rpc(
    p_customer_id UUID,
    p_items JSONB, -- JSON array of {product_id, quantity, unit_price}
    p_tax DECIMAL(15,2) DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    sale_id UUID := gen_random_uuid();
    tenant_id UUID;
    item_record JSONB;
    product_uuid UUID;
    product_name TEXT;
    item_quantity DECIMAL(10,3);
    item_price DECIMAL(10,2);
    item_total DECIMAL(10,2);
    subtotal DECIMAL(15,2) := 0;
    total_amount DECIMAL(15,2) := 0;
    items_array JSONB := '[]'::JSONB;
    movement_id UUID;
    ledger_id UUID;
BEGIN
    tenant_id := get_current_tenant_id();
    
    -- Process each item in sale
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        product_uuid := (item_record ->> 'product_id')::UUID;
        item_quantity := (item_record ->> 'quantity')::DECIMAL(10,3);
        item_price := (item_record ->> 'unit_price')::DECIMAL(10,2);
        item_total := item_quantity * item_price;
        
        -- Get product name
        SELECT name INTO product_name FROM products 
        WHERE id = product_uuid AND tenant_id = tenant_id;
        
        -- Record inventory movement (out)
        movement_id := create_inventory_movement(
            tenant_id, 
            product_uuid, 
            'out'::movement_type, 
            item_quantity, 
            'Sale transaction', 
            sale_id
        );
        
        -- Calculate running total
        subtotal := subtotal + item_total;
        
        -- Build items array for response
        items_array := items_array || jsonb_build_object(
            'product_id', product_uuid,
            'product_name', COALESCE(product_name, 'Unknown Product'),
            'quantity', item_quantity,
            'unit_price', item_price,
            'total_price', item_total
        );
    END LOOP;
    
    -- Calculate total with tax
    total_amount := subtotal + p_tax;
    
    -- Create sale record
    INSERT INTO sales (id, tenant_id, customer_id, subtotal, tax, total_amount)
    VALUES (sale_id, tenant_id, p_customer_id, subtotal, p_tax, total_amount);
    
    -- Create ledger entry for customer credit (sale on credit)
    ledger_id := create_ledger_entry(
        'customer'::entity_type, 
        p_customer_id, 
        'credit'::ledger_type, 
        total_amount, 
        'Sale transaction', 
        sale_id
    );
    
    -- Return JSON response matching TypeScript interface
    RETURN json_build_object(
        'id', sale_id,
        'created_at', NOW(),
        'items', items_array,
        'subtotal', subtotal,
        'tax', p_tax,
        'total_amount', total_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get sales (repository pattern)
CREATE OR REPLACE FUNCTION get_sales(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object('sales', (
        SELECT json_agg(json_build_object(
            'id', id,
            'customer_id', customer_id,
            'customer_name', (SELECT name FROM customers WHERE id = sales.customer_id),
            'subtotal', subtotal,
            'tax', tax,
            'total_amount', total_amount,
            'status', status,
            'payment_status', payment_status,
            'created_at', created_at,
            'updated_at', updated_at
        ))
        FROM sales
        WHERE tenant_id = get_current_tenant_id()
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get sales summary (matches SupabaseSaleRepository.getSalesSummary)
CREATE OR REPLACE FUNCTION get_sales_summary_rpc(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() - INTERVAL '30 days'),
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON AS $$
DECLARE
    total_sales BIGINT := 0;
    total_revenue DECIMAL(15,2) := 0;
    total_items BIGINT := 0;
    tenant_id UUID;
BEGIN
    tenant_id := get_current_tenant_id();
    
    -- Calculate sales metrics from sales table
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0)
    INTO total_sales, total_revenue
    FROM sales
    WHERE tenant_id = tenant_id
    AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- Calculate total items sold from sale_items
    SELECT COALESCE(SUM(quantity), 0)
    INTO total_items
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.tenant_id = tenant_id
    AND s.created_at BETWEEN p_start_date AND p_end_date;
    
    RETURN json_build_object(
        'total_sales', total_sales,
        'total_revenue', total_revenue,
        'total_items', total_items,
        'start_date', p_start_date,
        'end_date', p_end_date
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Grant Permissions
-- ========================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_inventory_movement_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_current_stock_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_products TO authenticated;
GRANT EXECUTE ON FUNCTION create_ledger_entry_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_entity_balance_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_customers TO authenticated;
GRANT EXECUTE ON FUNCTION get_tenant_suppliers TO authenticated;
GRANT EXECUTE ON FUNCTION create_sale_transaction_rpc TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_summary_rpc TO authenticated;

-- Grant execute permissions to service role for admin operations
GRANT EXECUTE ON FUNCTION create_inventory_movement_rpc TO service_role;
GRANT EXECUTE ON FUNCTION calculate_current_stock_rpc TO service_role;
GRANT EXECUTE ON FUNCTION get_tenant_products TO service_role;
GRANT EXECUTE ON FUNCTION create_ledger_entry_rpc TO service_role;
GRANT EXECUTE ON FUNCTION calculate_entity_balance_rpc TO service_role;
GRANT EXECUTE ON FUNCTION get_tenant_customers TO service_role;
GRANT EXECUTE ON FUNCTION get_tenant_suppliers TO service_role;
GRANT EXECUTE ON FUNCTION create_sale_transaction_rpc TO service_role;
GRANT EXECUTE ON FUNCTION get_sales TO service_role;
GRANT EXECUTE ON FUNCTION get_sales_summary_rpc TO service_role;