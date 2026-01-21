-- ==========================================
-- 012_USER_AUTH_TRIGGER - Configuración para Creación de Tenants
-- Implementa el trigger que sincroniza auth.users → public.users
-- Rol default: admin (no super_admin)
-- Ejecutar en Supabase SQL Editor
-- ==========================================

-- 1. Eliminar configuración existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. Crear tipo de roles si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tenant_role') THEN
        CREATE TYPE tenant_role AS ENUM ('super_admin', 'admin', 'vendedor', 'contador');
    END IF;
END $$;

-- 3. Crear función del trigger con mejor manejo de errores
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_tenant_id UUID;
    user_role tenant_role;
    tenant_exists BOOLEAN;
BEGIN
    -- Log para debugging
    RAISE NOTICE '🔧 Trigger ejecutado para usuario: %', NEW.email;
    
    -- Extraer tenant_id del metadata
    user_tenant_id := (NEW.raw_user_meta_data ->> 'tenant_id')::UUID;
    
    -- Validar tenant_id
    IF user_tenant_id IS NULL THEN
        RAISE EXCEPTION '❌ tenant_id es NULL en metadata para user: %', NEW.email;
    END IF;
    
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

-- 4. Crear el trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Verificar instalación
SELECT 
    'TRIGGER CREADO' as status,
    tgname as trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN '✅ Activado'
        WHEN 'D' THEN '❌ Desactivado'
        ELSE '⚠️ Desconocido'
    END as trigger_status,
    tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'
AND NOT tgisinternal;

-- 6. Verificar función
SELECT 
    'FUNCIÓN CREADA' as status,
    proname as function_name,
    prosecdef as security_definer,
    CASE prosecdef 
        WHEN true THEN '✅ Security Definer'
        ELSE '⚠️ Security Invoker'
    END as security_context
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 7. Test de integración completo
SELECT 
    'VERIFICACIÓN FINAL' as sección,
    (SELECT COUNT(*) FROM public.tenants) as total_tenants,
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM public.users) as total_users,
    CASE 
        WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.users) 
        THEN '✅ CONSISTENTE'
        ELSE '❌ INCONSISTENTE - Revisar trigger'
    END as consistency_status;

-- 8. Verificar RLS en tabla users
SELECT 
    'RLS USERS' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Si RLS no está habilitado, habilitarlo
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'users' AND rowsecurity = true) THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado en tabla users';
    END IF;
END $$;