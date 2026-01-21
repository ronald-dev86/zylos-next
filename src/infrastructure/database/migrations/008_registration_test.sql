-- Test user creation from registration flow

-- Step 1: Create a test tenant
INSERT INTO tenants (name, subdomain) 
VALUES ('Test Business', 'testbiz')
ON CONFLICT (subdomain) DO NOTHING
RETURNING id as test_tenant_id;

-- Step 2: Simulate auth.users creation (this happens via Supabase Auth)
-- We'll create a mock auth user entry for testing
-- In real scenario, this happens automatically with supabase.auth.signUp()

-- Step 3: Test the trigger function directly by simulating auth.users insert
DO $$
DECLARE
    test_tenant_uuid UUID;
    mock_auth_user_id UUID := gen_random_uuid();
BEGIN
    -- Get the test tenant ID
    SELECT id INTO test_tenant_uuid 
    FROM tenants 
    WHERE subdomain = 'testbiz';
    
    IF test_tenant_uuid IS NULL THEN
        RAISE EXCEPTION 'Test tenant not found';
    END IF;
    
    -- Simulate auth.users insertion (this would trigger our trigger)
    INSERT INTO auth.users (
        id,
        email,
        created_at,
        updated_at,
        raw_user_meta_data
    ) VALUES (
        mock_auth_user_id,
        'admin@testbiz.com',
        NOW(),
        NOW(),
        jsonb_build_object(
            'tenant_id', test_tenant_uuid::text,
            'role', 'admin'
        )
    );
    
    RAISE NOTICE 'Created mock auth user: %', mock_auth_user_id;
    RAISE NOTICE 'Tenant ID: %', test_tenant_uuid;
END $$;

-- Step 4: Verify the user was created in the users table
SELECT 
    'User Creation Test' as test_name,
    u.id,
    u.email,
    u.tenant_id,
    u.role,
    t.subdomain as tenant_subdomain,
    au.email as auth_email,
    au.raw_user_meta_data as auth_metadata
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'admin@testbiz.com';

-- Step 5: Test RLS policies (simulate different users)
-- Test 1: Verify the new admin can see their own user record
SELECT 
    'RLS Test - Admin Self Access' as test_name,
    COUNT(*) as record_count
FROM users 
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@testbiz.com');

-- Test 2: Verify user can only see records from their tenant
SELECT 
    'RLS Test - Tenant Isolation' as test_name,
    COUNT(*) as user_records_in_tenant
FROM users 
WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = 'testbiz');

-- Step 6: Test role verification function
SELECT 
    'Role Function Test' as test_name,
    user_has_role('admin') as can_access_admin_functions,
    user_has_role('vendedor') as can_access_vendedor_functions,
    user_has_role('contador') as can_access_contador_functions
FROM users u
JOIN auth.users au ON u.id = au.id
WHERE au.email = 'admin@testbiz.com';

-- Step 7: Test tenant info function
SELECT 
    'Tenant Info Function Test' as test_name,
    tenant_id,
    tenant_subdomain,
    user_role
FROM get_current_user_tenant()
LIMIT 1;

-- Cleanup (optional - comment out to inspect results)
-- DELETE FROM users WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@testbiz.com');
-- DELETE FROM auth.users WHERE email = 'admin@testbiz.com';
-- DELETE FROM tenants WHERE subdomain = 'testbiz';

-- Summary report
SELECT 
    'Registration Flow Test Summary' as report_title,
    COUNT(CASE WHEN u.role = 'admin' THEN 1 END) as admin_users_created,
    COUNT(CASE WHEN u.role = 'vendedor' THEN 1 END) as vendedor_users_created,
    COUNT(*) as total_test_users,
    string_agg(DISTINCT t.subdomain, ', ') as test_tenants
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN auth.users au ON u.id = au.id
WHERE au.email LIKE '%@test%.com';