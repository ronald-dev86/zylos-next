-- Cleanup duplicate user records
-- This migration will remove duplicates while keeping the most recent one

-- First, identify duplicates
WITH duplicates AS (
    SELECT 
        id,
        email,
        tenant_id,
        role,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY id ORDER BY created_at DESC) as rn
    FROM users
    WHERE id = '62f178a9-21d6-47f7-8377-c15796384633'
)
SELECT 
    'Duplicates Found' as operation,
    id,
    email,
    tenant_id,
    role,
    created_at,
    rn
FROM duplicates 
WHERE rn > 1;

-- Remove duplicates, keeping the most recent one
DELETE FROM users 
WHERE id = '62f178a9-21d6-47f7-8377-c15796384633'
AND created_at NOT IN (
    SELECT MAX(created_at)
    FROM users 
    WHERE id = '62f178a9-21d6-47f7-8377-c15796384633'
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE users ADD CONSTRAINT users_id_email_unique UNIQUE (id, email);

-- Verify the fix
SELECT 
    'After Cleanup' as verification,
    u.id,
    u.email,
    u.tenant_id,
    u.role,
    u.created_at,
    t.subdomain as tenant_subdomain
FROM users u
JOIN tenants t ON u.tenant_id = t.id
WHERE u.id = '62f178a9-21d6-47f7-8377-c15796384633';