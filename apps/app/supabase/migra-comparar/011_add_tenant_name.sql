-- Add name column to tenants table and update schema

-- Add name column (should exist but ensure it's properly configured)
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS name VARCHAR(100) NOT NULL DEFAULT '';

-- Update any existing tenants without proper names
UPDATE tenants 
SET name = CASE 
  WHEN name = '' OR name IS NULL THEN subdomain
  ELSE name
END
WHERE name = '' OR name IS NULL;

-- Ensure name is NOT NULL constraint
ALTER TABLE tenants 
ALTER COLUMN name SET NOT NULL;

-- Update tenant validation function to include name
CREATE OR REPLACE FUNCTION public.validate_tenant_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate name length
  IF LENGTH(NEW.name) < 3 THEN
    RAISE EXCEPTION 'Business name must be at least 3 characters';
  END IF;
  
  IF LENGTH(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Business name too long (max 100 characters)';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for tenant validation
DROP TRIGGER IF EXISTS validate_tenant_data_trigger ON tenants;
CREATE TRIGGER validate_tenant_data_trigger
    BEFORE INSERT OR UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_data();

-- Update trigger that was handling user creation to work without metadata dependency
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Test the updated schema
SELECT 
    'Tenant Schema Validation' as test,
    COUNT(*) as total_tenants,
    COUNT(CASE WHEN LENGTH(name) >= 3 THEN 1 END) as valid_names,
    COUNT(CASE WHEN name IS NULL OR name = '' THEN 1 END) as missing_names
FROM tenants;