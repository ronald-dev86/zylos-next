-- Debug query to find duplicate users
SELECT 
    'Duplicate Users Analysis' as analysis_type,
    id,
    email,
    tenant_id,
    role,
    created_at,
    COUNT(*) as duplicate_count
FROM users 
WHERE id = '62f178a9-21d6-47f7-8377-c15796384633'
GROUP BY id, email, tenant_id, role, created_at
HAVING COUNT(*) > 1;

-- Check all records for this auth user
SELECT 
    'All Records for Auth User' as analysis_type,
    u.id,
    u.email,
    u.tenant_id,
    u.role,
    u.created_at,
    t.subdomain as tenant_subdomain,
    au.email as auth_email,
    au.created_at as auth_created_at
FROM users u
JOIN tenants t ON u.tenant_id = t.id
JOIN auth.users au ON u.id = au.id
WHERE u.id = '62f178a9-21d6-47f7-8377-c15796384633'
ORDER BY u.created_at;

-- Check for orphaned records (users without auth.users)
SELECT 
    'Orphaned User Records' as analysis_type,
    u.id,
    u.email,
    u.tenant_id,
    u.role,
    u.created_at,
    CASE WHEN au.id IS NULL THEN 'ORPHANED' ELSE 'OK' END as status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.id = '62f178a9-21d6-47f7-8377-c15796384633';

-- Check for auth.users without users table records
SELECT 
    'Auth Users Without Users Table' as analysis_type,
    au.id,
    au.email,
    au.created_at,
    CASE WHEN u.id IS NULL THEN 'MISSING_USERS_RECORD' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.id = '62f178a9-21d6-47f7-8377-c15796384633';