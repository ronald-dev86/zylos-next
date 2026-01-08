-- RLS policies for tenant isolation and proper multi-tenancy

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenants policies - read-only for authenticated users
CREATE POLICY "Authenticated users can view tenants" ON tenants
    FOR SELECT USING (auth.role() = 'authenticated');

-- Update existing users policies to work with auth.users
DROP POLICY IF EXISTS "Users can view users from same tenant" ON users;
CREATE POLICY "Users can view users from same tenant" ON users
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage users from their tenant" ON users
    FOR ALL USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text AND
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Update products policies
DROP POLICY IF EXISTS "Users can view products from their tenant" ON products;
CREATE POLICY "Users can view products from their tenant" ON products
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

DROP POLICY IF EXISTS "Users can insert products for their tenant" ON products;
CREATE POLICY "Users can insert products for their tenant" ON products
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

DROP POLICY IF EXISTS "Users can update products from their tenant" ON products;
CREATE POLICY "Users can update products from their tenant" ON products
    FOR UPDATE USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

DROP POLICY IF EXISTS "Users can delete products from their tenant" ON products;
CREATE POLICY "Users can delete products from their tenant" ON products
    FOR DELETE USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text AND
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Update inventory movements policies
DROP POLICY IF EXISTS "Users can view movements from their tenant" ON inventory_movements;
CREATE POLICY "Users can view movements from their tenant" ON inventory_movements
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

DROP POLICY IF EXISTS "Users can insert movements for their tenant" ON inventory_movements;
CREATE POLICY "Users can insert movements for their tenant" ON inventory_movements
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

-- Update customers policies
DROP POLICY IF EXISTS "Users can view customers from their tenant" ON customers;
CREATE POLICY "Users can view customers from their tenant" ON customers
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

DROP POLICY IF EXISTS "Users can manage customers from their tenant" ON customers;
CREATE POLICY "Users can manage customers from their tenant" ON customers
    FOR ALL USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

-- Update suppliers policies
DROP POLICY IF EXISTS "Users can view suppliers from their tenant" ON suppliers;
CREATE POLICY "Users can view suppliers from their tenant" ON suppliers
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

DROP POLICY IF EXISTS "Users can manage suppliers from their tenant" ON suppliers;
CREATE POLICY "Users can manage suppliers from their tenant" ON suppliers
    FOR ALL USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

-- Update ledger entries policies
DROP POLICY IF EXISTS "Users can view ledger entries from their tenant" ON ledger_entries;
CREATE POLICY "Users can view ledger entries from their tenant" ON ledger_entries
    FOR SELECT USING (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

DROP POLICY IF EXISTS "Users can insert ledger entries for their tenant" ON ledger_entries;
CREATE POLICY "Users can insert ledger entries for their tenant" ON ledger_entries
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'tenant_id' = tenant_id::text OR 
        (SELECT tenant_id FROM users WHERE id = auth.uid()) = tenant_id
    );

-- Function to handle user signup and automatic tenant/user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_tenant_id UUID;
BEGIN
    -- Extract tenant_id from user metadata (set during registration)
    user_tenant_id := NEW.raw_user_meta_data ->> 'tenant_id';
    
    -- Insert into users table
    INSERT INTO public.users (id, email, tenant_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        user_tenant_id,
        COALESCE((NEW.raw_user_meta_data ->> 'role')::tenant_role, 'admin')
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user record on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to get current user's tenant info
CREATE OR REPLACE FUNCTION public.get_current_user_tenant()
RETURNS TABLE (
    tenant_id UUID,
    tenant_subdomain VARCHAR,
    user_role tenant_role
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.subdomain,
        u.role
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION public.user_has_role(required_role tenant_role)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users 
        WHERE id = auth.uid() 
        AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;