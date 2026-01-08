-- RPC Functions for Repository Layer
-- These functions implement the exact interface expected by our TypeScript repositories

-- ========================================
-- Inventory Movement Functions
-- ========================================

-- Create inventory movement (matches SupabaseInventoryMovementRepository.create)
CREATE OR REPLACE FUNCTION create_inventory_movement(
    p_tenant_id UUID,
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
BEGIN
    -- Validate movement type
    IF p_type NOT IN ('in', 'out', 'adjustment') THEN
        RAISE EXCEPTION 'Invalid movement type: %', p_type;
    END IF;
    
    -- Validate sufficient stock for outgoing movements
    IF p_type = 'out' THEN
        current_stock := calculate_stock(p_product_id, p_tenant_id);
        IF current_stock < p_quantity THEN
            RAISE EXCEPTION 'Insufficient stock. Current: %, Required: %', current_stock, p_quantity;
        END IF;
    END IF;
    
    -- Create inventory movement
    INSERT INTO inventory_movements (tenant_id, product_id, type, quantity, reason, reference_id)
    VALUES (p_tenant_id, p_product_id, p_type::movement_type, p_quantity, p_reason, p_reference_id)
    RETURNING id, created_at INTO movement_id;
    
    -- Return JSON response matching TypeScript interface
    RETURN json_build_object('id', movement_id, 'created_at', (SELECT created_at FROM inventory_movements WHERE id = movement_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate current stock (matches SupabaseInventoryMovementRepository.calculateCurrentStock)
CREATE OR REPLACE FUNCTION calculate_current_stock(
    p_tenant_id UUID,
    p_product_id UUID
)
RETURNS JSON AS $$
DECLARE
    stock_amount DECIMAL(10,3);
BEGIN
    stock_amount := calculate_stock(p_product_id, p_tenant_id);
    
    RETURN json_build_object('stock', stock_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Ledger Entry Functions
-- ========================================

-- Create ledger entry (matches SupabaseLedgerEntryRepository.create)
CREATE OR REPLACE FUNCTION create_ledger_entry(
    p_tenant_id UUID,
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
BEGIN
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
    VALUES (p_tenant_id, p_entity_type::entity_type, p_entity_id, p_type::ledger_type, p_amount, p_description, p_reference_id)
    RETURNING id, created_at INTO ledger_id;
    
    -- Return JSON response matching TypeScript interface
    RETURN json_build_object('id', ledger_id, 'created_at', (SELECT created_at FROM ledger_entries WHERE id = ledger_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate entity balance (matches SupabaseLedgerEntryRepository.calculateEntityBalance)
CREATE OR REPLACE FUNCTION calculate_entity_balance(
    p_tenant_id UUID,
    p_entity_type TEXT, -- 'customer', 'supplier'
    p_entity_id UUID
)
RETURNS JSON AS $$
DECLARE
    balance_amount DECIMAL(15,2);
BEGIN
    IF p_entity_type = 'customer' THEN
        balance_amount := get_customer_balance(p_entity_id, p_tenant_id);
    ELSIF p_entity_type = 'supplier' THEN
        balance_amount := get_supplier_balance(p_entity_id, p_tenant_id);
    ELSE
        RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
    END IF;
    
    RETURN json_build_object('balance', balance_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Sales Functions
-- ========================================

-- Create sale transaction (enhanced version matching SupabaseSaleRepository.create)
CREATE OR REPLACE FUNCTION create_sale_transaction(
    p_tenant_id UUID,
    p_customer_id UUID,
    p_items JSONB, -- JSON array of {product_id, quantity, unit_price}
    p_tax DECIMAL(15,2) DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
    sale_id UUID := gen_random_uuid();
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
    -- Process each item in sale
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        product_uuid := (item_record ->> 'product_id')::UUID;
        item_quantity := (item_record ->> 'quantity')::DECIMAL(10,3);
        item_price := (item_record ->> 'unit_price')::DECIMAL(10,2);
        item_total := item_quantity * item_price;
        
        -- Get product name
        SELECT name INTO product_name FROM products 
        WHERE id = product_uuid AND tenant_id = p_tenant_id;
        
        -- Record inventory movement (out)
        movement_id := record_inventory_movement(
            p_tenant_id, 
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
    
    -- Create ledger entry for customer credit (sale on credit)
    INSERT INTO ledger_entries (tenant_id, entity_type, entity_id, type, amount, description, reference_id)
    VALUES (p_tenant_id, 'customer'::entity_type, p_customer_id, 'credit'::ledger_type, total_amount, 'Sale transaction', sale_id)
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

-- Get sales summary (matches SupabaseSaleRepository.getSalesSummary)
CREATE OR REPLACE FUNCTION get_sales_summary(
    p_tenant_id UUID,
    p_start_date TIMESTAMP WITH TIME ZONE,
    p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS JSON AS $$
DECLARE
    total_sales BIGINT := 0;
    total_revenue DECIMAL(15,2) := 0;
    total_items BIGINT := 0;
BEGIN
    -- Calculate sales metrics from ledger entries (customer credits = sales)
    SELECT 
        COUNT(*),
        COALESCE(SUM(amount), 0)
    INTO total_sales, total_revenue
    FROM ledger_entries
    WHERE entity_type = 'customer' 
    AND type = 'credit' 
    AND tenant_id = p_tenant_id
    AND created_at BETWEEN p_start_date AND p_end_date;
    
    -- Calculate total items sold from inventory movements (out movements from sales)
    SELECT COALESCE(SUM(quantity), 0)
    INTO total_items
    FROM inventory_movements
    WHERE type = 'out'
    AND tenant_id = p_tenant_id
    AND created_at BETWEEN p_start_date AND p_end_date
    AND reason = 'Sale transaction';
    
    RETURN json_build_object(
        'total_sales', total_sales,
        'total_revenue', total_revenue,
        'total_items', total_items
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- Enable Row Level Security for new functions
-- ========================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_inventory_movement TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_current_stock TO authenticated;
GRANT EXECUTE ON FUNCTION create_ledger_entry TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_entity_balance TO authenticated;
GRANT EXECUTE ON FUNCTION create_sale_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION get_sales_summary TO authenticated;

-- Grant execute permissions to service role for admin operations
GRANT EXECUTE ON FUNCTION create_inventory_movement TO service_role;
GRANT EXECUTE ON FUNCTION calculate_current_stock TO service_role;
GRANT EXECUTE ON FUNCTION create_ledger_entry TO service_role;
GRANT EXECUTE ON FUNCTION calculate_entity_balance TO service_role;
GRANT EXECUTE ON FUNCTION create_sale_transaction TO service_role;
GRANT EXECUTE ON FUNCTION get_sales_summary TO service_role;