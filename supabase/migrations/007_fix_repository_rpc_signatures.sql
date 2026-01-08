-- Fix Repository Function Signatures
-- This migration fixes function parameter naming to match exactly what the TypeScript repositories expect

-- Drop existing functions to recreate with correct signatures
DROP FUNCTION IF EXISTS create_inventory_movement(p_tenant_id UUID, p_product_id UUID, p_type TEXT, p_quantity DECIMAL(10,3), p_reason TEXT, p_reference_id UUID);
DROP FUNCTION IF EXISTS calculate_current_stock(p_tenant_id UUID, p_product_id UUID);
DROP FUNCTION IF EXISTS create_ledger_entry(p_tenant_id UUID, p_entity_type TEXT, p_entity_id UUID, p_type TEXT, p_amount DECIMAL(15,2), p_description TEXT, p_reference_id UUID);
DROP FUNCTION IF EXISTS calculate_entity_balance(p_tenant_id UUID, p_entity_type TEXT, p_entity_id UUID);
DROP FUNCTION IF EXISTS create_sale_transaction(p_tenant_id UUID, p_customer_id UUID, p_items JSONB, p_tax DECIMAL(15,2));
DROP FUNCTION IF EXISTS get_sales_summary(p_tenant_id UUID, p_start_date TIMESTAMP WITH TIME ZONE, p_end_date TIMESTAMP WITH TIME ZONE);

-- ========================================
-- Inventory Movement Functions (Fixed)
-- ========================================

-- Create inventory movement (exact match for SupabaseInventoryMovementRepository)
CREATE OR REPLACE FUNCTION create_inventory_movement(
    p_product_id UUID,
    p_type TEXT, -- 'in', 'out', 'adjustment'
    p_quantity DECIMAL(10,3),
    p_reason TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    movement_id UUID;
    tenant_id UUID;
    current_stock DECIMAL(10,3);
BEGIN
    -- Get tenant_id from JWT token
    tenant_id := auth.jwt() ->> 'tenant_id'::UUID;
    
    -- Validate movement type
    IF p_type NOT IN ('in', 'out', 'adjustment') THEN
        RAISE EXCEPTION 'Invalid movement type: %', p_type;
    END IF;
    
    -- Validate sufficient stock for outgoing movements
    IF p_type = 'out' THEN
        current_stock := calculate_stock(p_product_id, tenant_id);
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

-- Calculate current stock (exact match for SupabaseInventoryMovementRepository)
CREATE OR REPLACE FUNCTION calculate_current_stock(
    p_product_id UUID
)
RETURNS JSON AS $$
DECLARE
    stock_amount DECIMAL(10,3);
    tenant_id UUID;
BEGIN
    -- Get tenant_id from JWT token
    tenant_id := auth.jwt() ->> 'tenant_id'::UUID;
    
    stock_amount := calculate_stock(p_product_id, tenant_id);
    
    RETURN json_build_object('stock', stock_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Ledger Entry Functions (Fixed)
-- ========================================

-- Create ledger entry (exact match for SupabaseLedgerEntryRepository)
CREATE OR REPLACE FUNCTION create_ledger_entry(
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
    -- Get tenant_id from JWT token
    tenant_id := auth.jwt() ->> 'tenant_id'::UUID;
    
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

-- Calculate entity balance (exact match for SupabaseLedgerEntryRepository)
CREATE OR REPLACE FUNCTION calculate_entity_balance(
    p_entity_type TEXT, -- 'customer', 'supplier'
    p_entity_id UUID
)
RETURNS JSON AS $$
DECLARE
    balance_amount DECIMAL(15,2);
    tenant_id UUID;
BEGIN
    -- Get tenant_id from JWT token
    tenant_id := auth.jwt() ->> 'tenant_id'::UUID;
    
    IF p_entity_type = 'customer' THEN
        balance_amount := get_customer_balance(p_entity_id, tenant_id);
    ELSIF p_entity_type = 'supplier' THEN
        balance_amount := get_supplier_balance(p_entity_id, tenant_id);
    ELSE
        RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
    END IF;
    
    RETURN json_build_object('balance', balance_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Sales Functions (Fixed)
-- ========================================

-- Create sale transaction (enhanced version exact match for SupabaseSaleRepository)
CREATE OR REPLACE FUNCTION create_sale_transaction(
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
    -- Get tenant_id from JWT token
    tenant_id := auth.jwt() ->> 'tenant_id'::UUID;
    
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
        movement_id := record_inventory_movement(
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
    
    -- Create sales record
    INSERT INTO sales (id, tenant_id, customer_id, subtotal, tax, total_amount, status, payment_status)
    VALUES (sale_id, tenant_id, p_customer_id, subtotal, p_tax, total_amount, 'completed', 'pending');
    
    -- Create sale items records
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        product_uuid := (item_record ->> 'product_id')::UUID;
        item_quantity := (item_record ->> 'quantity')::DECIMAL(10,3);
        item_price := (item_record ->> 'unit_price')::DECIMAL(10,2);
        
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
        VALUES (sale_id, product_uuid, item_quantity, item_price);
    END LOOP;
    
    -- Create ledger entry for customer credit (sale on credit)
    INSERT INTO ledger_entries (tenant_id, entity_type, entity_id, type, amount, description, reference_id)
    VALUES (tenant_id, 'customer'::entity_type, p_customer_id, 'credit'::ledger_type, total_amount, 'Sale transaction', sale_id)
    RETURNING id INTO ledger_id;
    
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

-- Get sales summary (exact match for SupabaseSaleRepository)
CREATE OR REPLACE FUNCTION get_sales_summary(
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSON AS $$
DECLARE
    total_sales BIGINT := 0;
    total_revenue DECIMAL(15,2) := 0;
    total_items BIGINT := 0;
    tenant_id UUID;
BEGIN
    -- Get tenant_id from JWT token
    tenant_id := auth.jwt() ->> 'tenant_id'::UUID;
    
    -- Calculate sales metrics from sales table (more accurate than ledger entries)
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0)
    INTO total_sales, total_revenue
    FROM sales
    WHERE tenant_id = tenant_id
    AND created_at BETWEEN p_start_date AND p_end_date
    AND status = 'completed';
    
    -- Calculate total items sold from sale items
    SELECT COALESCE(SUM(quantity), 0)
    INTO total_items
    FROM sale_items
    WHERE sale_id IN (
        SELECT id FROM sales 
        WHERE tenant_id = tenant_id 
        AND created_at BETWEEN p_start_date AND p_end_date 
        AND status = 'completed'
    );
    
    RETURN json_build_object(
        'total_sales', total_sales,
        'total_revenue', total_revenue,
        'total_items', total_items
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Grant Permissions (Updated)
-- ========================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_inventory_movement TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_current_stock TO authenticated;
GRANT EXECUTE ON FUNCTION create_ledger_entry TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_entity_balance TO authenticated;
GRANT EXECUTE ON FUNCTION create_sale_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_summary TO authenticated;