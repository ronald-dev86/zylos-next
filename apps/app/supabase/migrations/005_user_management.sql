-- =========================================================================
-- ZYLOS HYBRID MERGE: USER MANAGEMENT (005_user_management)
-- Taking user management automation from migra-comparar
-- =========================================================================

-- Function to handle user signup and automatic tenant/user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_tenant_id UUID;
BEGIN
    -- Extract tenant_id from user metadata (set during registration)
    user_tenant_id := NEW.raw_user_meta_data::jsonb ->> 'tenant_id';
    
    -- Insert into users table
    INSERT INTO public.users (id, email, tenant_id, role)
    VALUES (
        NEW.id,
        NEW.email,
        user_tenant_id,
        COALESCE((NEW.raw_user_meta_data::jsonb ->> 'role')::tenant_role, 'admin')
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

-- Function to validate tenant name and subdomain
CREATE OR REPLACE FUNCTION public.validate_tenant_data()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate tenant name is not empty
    IF NEW.name IS NULL OR TRIM(NEW.name) = '' THEN
        RAISE EXCEPTION 'Tenant name cannot be empty';
    END IF;
    
    -- Validate subdomain format (alphanumeric and hyphens only)
    IF NEW.subdomain !~ '^[a-z0-9-]+$' THEN
        RAISE EXCEPTION 'Subdomain can only contain lowercase letters, numbers, and hyphens';
    END IF;
    
    -- Validate subdomain length
    IF LENGTH(NEW.subdomain) < 3 OR LENGTH(NEW.subdomain) > 50 THEN
        RAISE EXCEPTION 'Subdomain must be between 3 and 50 characters';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add validation trigger for tenants
CREATE OR REPLACE TRIGGER validate_tenant_before_insert
    BEFORE INSERT OR UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_data();