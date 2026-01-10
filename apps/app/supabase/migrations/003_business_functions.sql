-- =========================================================================
-- ZYLOS HYBRID MERGE: BUSINESS FUNCTIONS (003_business_functions)
-- Taking core business logic from migrations
-- =========================================================================

-- Function to get current tenant_id from JWT
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.jwt() ->> 'tenant_id'::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate current stock for a product
CREATE OR REPLACE FUNCTION calculate_current_stock(p_tenant_id UUID, p_product_id UUID)
RETURNS DECIMAL(10,3) AS $$
DECLARE
    current_stock DECIMAL(10,3) := 0;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'in' THEN quantity
            WHEN type = 'out' THEN -quantity
            WHEN type = 'adjustment' THEN quantity
            ELSE 0
        END
    ), 0) INTO current_stock
    FROM inventory_movements
    WHERE tenant_id = p_tenant_id AND product_id = p_product_id;
    
    RETURN current_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create inventory movement
CREATE OR REPLACE FUNCTION create_inventory_movement(
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
BEGIN
    INSERT INTO inventory_movements (
        tenant_id, product_id, type, quantity, reason, reference_id
    ) VALUES (
        p_tenant_id, p_product_id, p_type, p_quantity, p_reason, p_reference_id
    ) RETURNING id INTO movement_id;
    
    RETURN movement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate entity balance
CREATE OR REPLACE FUNCTION calculate_entity_balance(
    p_tenant_id UUID,
    p_entity_type entity_type,
    p_entity_id UUID
)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    balance DECIMAL(15,2) := 0;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN type = 'credit' THEN amount
            WHEN type = 'debit' THEN -amount
            ELSE 0
        END
    ), 0) INTO balance
    FROM ledger_entries
    WHERE tenant_id = p_tenant_id 
    AND entity_type = p_entity_type 
    AND entity_id = p_entity_id;
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create ledger entry
CREATE OR REPLACE FUNCTION create_ledger_entry(
    p_tenant_id UUID,
    p_entity_type entity_type,
    p_entity_id UUID,
    p_type ledger_type,
    p_amount DECIMAL(15,2),
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    entry_id UUID;
    current_balance DECIMAL(15,2);
BEGIN
    -- Calculate new balance
    current_balance := calculate_entity_balance(p_tenant_id, p_entity_type, p_entity_id);
    
    IF p_type = 'debit' THEN
        current_balance := current_balance + p_amount;
    ELSIF p_type = 'credit' THEN
        current_balance := current_balance - p_amount;
    END IF;
    
    -- Create ledger entry
    INSERT INTO ledger_entries (
        tenant_id, entity_type, entity_id, type, amount, description, reference_id
    ) VALUES (
        p_tenant_id, p_entity_type, p_entity_id, p_type, p_amount, p_description, p_reference_id
    ) RETURNING id INTO entry_id;
    
    RETURN entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;