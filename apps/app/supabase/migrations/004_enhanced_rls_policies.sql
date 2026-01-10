-- =========================================================================
-- ZYLOS HYBRID MERGE: ENHANCED RLS POLICIES (004_enhanced_rls_policies)
-- Taking enhanced RLS with dual validation from migra-comparar
-- =========================================================================

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Enable RLS on sales and sale_items tables
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Tenants policies - allow unauthenticated access for tenant creation
CREATE POLICY "Allow tenant creation for signup" ON tenants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view tenants" ON tenants
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow tenant updates for admins" ON tenants
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Enhanced Users policies with dual validation
CREATE POLICY "Users can view users from same tenant" ON users
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage users from their tenant" ON users
    FOR ALL USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text AND
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Enhanced Products policies with dual validation
CREATE POLICY "Users can view products from their tenant" ON products
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

CREATE POLICY "Users can insert products for their tenant" ON products
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

CREATE POLICY "Users can update products from their tenant" ON products
    FOR UPDATE USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

CREATE POLICY "Admins can delete products from their tenant" ON products
    FOR DELETE USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text AND
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Enhanced Inventory movements policies with dual validation
CREATE POLICY "Users can view movements from their tenant" ON inventory_movements
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

CREATE POLICY "Users can insert movements for their tenant" ON inventory_movements
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

-- Enhanced Customers policies with dual validation
CREATE POLICY "Users can view customers from their tenant" ON customers
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

CREATE POLICY "Users can manage customers from their tenant" ON customers
    FOR ALL USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

-- Enhanced Suppliers policies with dual validation
CREATE POLICY "Users can view suppliers from their tenant" ON suppliers
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

CREATE POLICY "Users can manage suppliers from their tenant" ON suppliers
    FOR ALL USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

-- Enhanced Ledger entries policies with dual validation
CREATE POLICY "Users can view ledger entries from their tenant" ON ledger_entries
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

CREATE POLICY "Users can insert ledger entries for their tenant" ON ledger_entries
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

-- Enhanced Sales policies with dual validation
CREATE POLICY "Users can view sales from their tenant" ON sales
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

CREATE POLICY "Users can insert sales for their tenant" ON sales
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

CREATE POLICY "Users can update sales from their tenant" ON sales
    FOR UPDATE USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

-- Enhanced Sale items policies with dual validation
CREATE POLICY "Users can view sale items from their tenant" ON sale_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales 
            WHERE sales.id = sale_items.sale_id 
            AND (
                sales.tenant_id = auth.jwt() ->> 'tenant_id'::UUID OR 
                (SELECT tenant_id FROM users WHERE id = auth.uid()) = sales.tenant_id
            )
        )
    );

CREATE POLICY "Users can insert sale items for their tenant" ON sale_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales 
            WHERE sales.id = sale_items.sale_id 
            AND (
                sales.tenant_id = auth.jwt() ->> 'tenant_id'::UUID OR 
                (SELECT tenant_id FROM users WHERE id = auth.uid()) = sales.tenant_id
            )
        )
    );