-- =========================================================================
-- ZYLOS: FIX TENANT RLS POLICY (009_fix_tenant_rls.sql)
-- =========================================================================

-- Drop existing restrictive tenant policies
DROP POLICY IF EXISTS "Authenticated users can view tenants" ON tenants;

-- Create permissive tenant policies
-- Allow unauthenticated access for tenant creation (signup flow)
CREATE POLICY "Allow tenant creation" ON tenants
    FOR INSERT WITH CHECK (true);

-- Allow authenticated users to view tenants
CREATE POLICY "Authenticated users can view tenants" ON tenants
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow admin users to update tenants
CREATE POLICY "Allow tenant updates for admins" ON tenants
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Allow super_admin to delete tenants (if needed)
CREATE POLICY "Allow tenant deletion for super_admins" ON tenants
    FOR DELETE USING (
        auth.jwt() ->> 'role' = 'super_admin'
    );

-- Grant necessary permissions
GRANT ALL ON tenants TO authenticated;
GRANT ALL ON tenants TO service_role;