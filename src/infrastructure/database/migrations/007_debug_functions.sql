-- Función para verificar creación de usuario
CREATE OR REPLACE FUNCTION public.debug_user_creation()
RETURNS TABLE (
    auth_user_id UUID,
    auth_email TEXT,
    auth_metadata JSONB,
    db_user_id UUID,
    db_email TEXT,
    db_tenant_id UUID,
    db_role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id::UUID,
        au.email::TEXT,
        au.raw_user_meta_data::JSONB,
        u.id::UUID,
        u.email::TEXT,
        u.tenant_id::UUID,
        u.role::TEXT
    FROM auth.users au
    LEFT JOIN public.users u ON au.id = u.id
    WHERE au.created_at > NOW() - INTERVAL '1 hour'
    ORDER BY au.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;