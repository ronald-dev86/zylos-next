-- Database Functions for Business Logic

-- Function to calculate current stock for a product
CREATE OR REPLACE FUNCTION calculate_stock(product_uuid UUID, tenant_uuid UUID)
RETURNS DECIMAL(10,3) AS $$
DECLARE
    current_stock DECIMAL(10,3) := 0;
BEGIN
    SELECT COALESCE(SUM(CASE 
        WHEN type = 'in' THEN quantity
        WHEN type = 'out' THEN -quantity
        WHEN type = 'adjustment' THEN quantity
        ELSE 0
    END), 0) INTO current_stock
    FROM inventory_movements
    WHERE product_id = product_uuid AND tenant_id = tenant_uuid;
    
    RETURN current_stock;
END;
$$ LANGUAGE plpgsql;

-- Function to record inventory movement (transactional)
CREATE OR REPLACE FUNCTION record_inventory_movement(
    p_tenant_id UUID,
    p_product_id UUID,
    p_type movement_type,
    p_quantity DECIMAL(10,3),
    p_reason TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    movement_id UUID;
    current_stock DECIMAL(10,3);
BEGIN
    -- Validate sufficient stock for outgoing movements
    IF p_type = 'out' THEN
        current_stock := calculate_stock(p_product_id, p_tenant_id);
        IF current_stock < p_quantity THEN
            RAISE EXCEPTION 'Insufficient stock. Current: %, Required: %', current_stock, p_quantity;
        END IF;
    END IF;
    
    -- Create the inventory movement
    INSERT INTO inventory_movements (tenant_id, product_id, type, quantity, reason, reference_id)
    VALUES (p_tenant_id, p_product_id, p_type, p_quantity, p_reason, p_reference_id)
    RETURNING id INTO movement_id;
    
    RETURN movement_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create sales transaction (complete transaction)
CREATE OR REPLACE FUNCTION create_sale_transaction(
    p_tenant_id UUID,
    p_customer_id UUID,
    p_items JSONB -- JSON array of {product_id, quantity, unit_price}
)
RETURNS UUID AS $$
DECLARE
    sale_id UUID := gen_random_uuid();
    item_record JSONB;
    product_uuid UUID;
    item_quantity DECIMAL(10,3);
    item_price DECIMAL(10,2);
    total_amount DECIMAL(15,2) := 0;
    movement_id UUID;
    ledger_id UUID;
BEGIN
    -- Process each item in the sale
    FOR item_record IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        product_uuid := (item_record ->> 'product_id')::UUID;
        item_quantity := (item_record ->> 'quantity')::DECIMAL(10,3);
        item_price := (item_record ->> 'unit_price')::DECIMAL(10,2);
        
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
        total_amount := total_amount + (item_quantity * item_price);
    END LOOP;
    
    -- Create ledger entry for customer credit (sale on credit)
    INSERT INTO ledger_entries (tenant_id, entity_type, entity_id, type, amount, description, reference_id)
    VALUES (p_tenant_id, 'customer'::entity_type, p_customer_id, 'credit'::ledger_type, total_amount, 'Sale transaction', sale_id)
    RETURNING id INTO ledger_id;
    
    RETURN sale_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer balance
CREATE OR REPLACE FUNCTION get_customer_balance(customer_uuid UUID, tenant_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    balance DECIMAL(15,2) := 0;
BEGIN
    SELECT COALESCE(SUM(CASE 
        WHEN type = 'credit' THEN amount
        WHEN type = 'debit' THEN -amount
        ELSE 0
    END), 0) INTO balance
    FROM ledger_entries
    WHERE entity_type = 'customer' 
    AND entity_id = customer_uuid 
    AND tenant_id = tenant_uuid;
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Function to get supplier balance
CREATE OR REPLACE FUNCTION get_supplier_balance(supplier_uuid UUID, tenant_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    balance DECIMAL(15,2) := 0;
BEGIN
    SELECT COALESCE(SUM(CASE 
        WHEN type = 'debit' THEN amount
        WHEN type = 'credit' THEN -amount
        ELSE 0
    END), 0) INTO balance
    FROM ledger_entries
    WHERE entity_type = 'supplier' 
    AND entity_id = supplier_uuid 
    AND tenant_id = tenant_uuid;
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Function to record payment (reduces customer credit or supplier debit)
CREATE OR REPLACE FUNCTION record_payment(
    p_tenant_id UUID,
    p_entity_type entity_type,
    p_entity_id UUID,
    p_amount DECIMAL(15,2),
    p_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    payment_id UUID := gen_random_uuid();
    current_balance DECIMAL(15,2);
    ledger_type_value ledger_type;
BEGIN
    -- Check current balance
    IF p_entity_type = 'customer' THEN
        current_balance := get_customer_balance(p_entity_id, p_tenant_id);
        ledger_type_value := 'debit'::ledger_type; -- Payment reduces customer credit
        
        IF current_balance < p_amount THEN
            RAISE EXCEPTION 'Payment amount exceeds customer balance. Current: %, Payment: %', current_balance, p_amount;
        END IF;
    ELSIF p_entity_type = 'supplier' THEN
        current_balance := get_supplier_balance(p_entity_id, p_tenant_id);
        ledger_type_value := 'credit'::ledger_type; -- Payment reduces supplier debit
        
        IF current_balance < p_amount THEN
            RAISE EXCEPTION 'Payment amount exceeds supplier balance. Current: %, Payment: %', current_balance, p_amount;
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
    END IF;
    
    -- Create ledger entry
    INSERT INTO ledger_entries (tenant_id, entity_type, entity_id, type, amount, description, reference_id)
    VALUES (p_tenant_id, p_entity_type, ledger_type_value, p_amount, p_description, payment_id)
    RETURNING id INTO payment_id;
    
    RETURN payment_id;
END;
$$ LANGUAGE plpgsql;