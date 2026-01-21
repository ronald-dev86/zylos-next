-- ==========================================
-- 013_FIX_USERS_DEFAULT_CONSTRAINT - Corregir tabla users
-- El problema: DEFAULT 'vendedor'::tenant_role bloquea el trigger
-- ==========================================

-- 1. Eliminar el constraint default problemático
ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;

-- 2. Verificar que el constraint fue eliminado
SELECT 
    'CONSTRAINT ELIMINADO' as status,
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name = 'role';

-- 3. Probar trigger nuevamente
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_tenant_id UUID;
BEGIN
    -- Obtener un tenant válido
    SELECT id INTO test_tenant_id
    FROM public.tenants 
    LIMIT 1;
    
    IF test_tenant_id IS NULL THEN
        RAISE NOTICE '❌ No hay tenants disponibles para prueba';
        RETURN;
    END IF;
    
    -- Probar inserción manual con role='admin'
    INSERT INTO public.users (
        id, 
        email, 
        tenant_id, 
        role, 
        created_at
    ) VALUES (
        test_user_id,
        'test@trigger-fix.com',
        test_tenant_id,
        'admin',
        NOW()
    );
    
    -- Verificar inserción
    IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id AND role = 'admin') THEN
        RAISE NOTICE '✅ Inserción con role=admin funciona correctamente';
    ELSE
        RAISE NOTICE '❌ Inserción falló o role incorrecto';
    END IF;
    
    -- Limpiar
    DELETE FROM public.users WHERE id = test_user_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error al probar inserción: %', SQLERRM;
    IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
        DELETE FROM public.users WHERE id = test_user_id;
    END IF;
END $$;

-- 4. Verificar trigger sigue funcionando
SELECT 
    'TRIGGER READY' as status,
    tgname as trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN '✅ Enabled'
        WHEN 'D' THEN '❌ Disabled'
        ELSE '⚠️ Unknown'
    END as trigger_status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'
AND NOT tgisinternal;