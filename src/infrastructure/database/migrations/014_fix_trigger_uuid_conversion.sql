-- ==========================================
-- FIX TRIGGER - Corregir extracción de tenant_id
-- El problema: tenant_id llega como string pero trigger espera UUID
-- ==========================================

-- 1. Eliminar trigger actual
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Corregir la función del trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_tenant_id UUID;
    user_role tenant_role;
    tenant_exists BOOLEAN;
    tenant_id_text TEXT;
BEGIN
    -- Log para debugging
    RAISE NOTICE '🔧 Trigger ejecutado para usuario: %', NEW.email;
    
    -- Extraer tenant_id como TEXT primero
    tenant_id_text := NEW.raw_user_meta_data ->> 'tenant_id';
    
    -- Validar tenant_id
    IF tenant_id_text IS NULL THEN
        RAISE EXCEPTION '❌ tenant_id es NULL en metadata para user: %', NEW.email;
    END IF;
    
    -- Convertir a UUID con manejo de errores
    BEGIN
        user_tenant_id := tenant_id_text::UUID;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION '❌ tenant_id inválido (%): %', tenant_id_text, SQLERRM;
    END;
    
    -- Verificar que el tenant existe
    SELECT EXISTS(SELECT 1 FROM public.tenants WHERE id = user_tenant_id) INTO tenant_exists;
    
    IF NOT tenant_exists THEN
        RAISE EXCEPTION '❌ Tenant % no existe para user: %', user_tenant_id, NEW.email;
    END IF;
    
    -- Extraer rol del metadata o usar default
    BEGIN
        user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::tenant_role, 'admin');
    EXCEPTION WHEN OTHERS THEN
        user_role := 'admin';
        RAISE NOTICE '⚠️ Rol inválido, usando admin para: %', NEW.email;
    END;
    
    -- Insertar en tabla users
    INSERT INTO public.users (
        id, 
        email, 
        tenant_id, 
        role, 
        created_at
    ) VALUES (
        NEW.id,
        NEW.email,
        user_tenant_id,
        user_role,
        NEW.created_at
    );
    
    RAISE NOTICE '✅ Usuario creado exitosamente: % en tenant %', NEW.email, user_tenant_id;
    
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error en trigger handle_new_user: %', SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recrear el trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. Verificar trigger
SELECT 
    'TRIGGER FIXED' as status,
    tgname as trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN '✅ Enabled'
        WHEN 'D' THEN '❌ Disabled'
        ELSE '⚠️ Unknown'
    END as trigger_status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'
AND NOT tgisinternal;

-- 5. Probar trigger corregido
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    tenant_id_text TEXT;
BEGIN
    -- Obtener tenant_id como texto
    SELECT id::text INTO tenant_id_text FROM public.tenants LIMIT 1;
    
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at, 
        created_at, updated_at, raw_user_meta_data
    ) VALUES (
        test_user_id,
        'fixed-test@example.com',
        crypt('password', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        jsonb_build_object(
            'tenant_id', tenant_id_text,
            'role', 'admin'
        )
    );
    
    IF EXISTS (SELECT 1 FROM public.users WHERE id = test_user_id) THEN
        RAISE NOTICE '✅ Trigger corregido funciona!';
    ELSE
        RAISE NOTICE '❌ Trigger sigue fallando';
    END IF;
    
    -- Limpiar
    DELETE FROM public.users WHERE id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Error en prueba: %', SQLERRM;
END $$;