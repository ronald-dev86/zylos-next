-- Test query to verify trigger functionality
-- Check if users are being created in public.users table

SELECT 
    u.id,
    u.email,
    u.tenant_id,
    u.role,
    u.created_at,
    t.name as tenant_name,
    t.subdomain
FROM public.users u
JOIN tenants t ON u.tenant_id = t.id
ORDER BY u.created_at DESC;

-- Also check if there are any auth.users without corresponding public.users
SELECT 
    a.id,
    a.email,
    a.created_at,
    CASE WHEN u.id IS NULL THEN 'MISSING in public.users' ELSE 'OK' END as status
FROM auth.users a
LEFT JOIN public.users u ON a.id = u.id
ORDER BY a.created_at DESC;