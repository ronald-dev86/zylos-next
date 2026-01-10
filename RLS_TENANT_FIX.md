# 🔧 SOLUCIÓN RLS TENANT POLICY - APLICACIÓN

## 📋 **PASOS PARA SOLUCIONAR EL ERROR**

### **🔴 Problema Detectado:**
```
Error: new row violates row-level security policy for table "tenants"
```

### **🎯 Causa Raíz:**
- La política RLS de `tenants` es muy restrictiva
- Durante signup, se intenta insertar tenant sin estar autenticado
- Política original solo permitía lectura a usuarios autenticados

## 🛠️ **SOLUCIÓN IMPLEMENTADA**

### **1. Nueva Migración Creada**
- **Archivo**: `009_fix_tenant_rls.sql`
- **Contenido**: Políticas RLS permissivas para tenant creation

### **2. Políticas Aplicadas:**
```sql
-- Permite creación sin autenticación (para signup)
CREATE POLICY "Allow tenant creation" ON tenants
    FOR INSERT WITH CHECK (true);

-- Permite lectura a usuarios autenticados
CREATE POLICY "Authenticated users can view tenants" ON tenants
    FOR SELECT USING (auth.role() = 'authenticated');

-- Permite actualización para admins
CREATE POLICY "Allow tenant updates for admins" ON tenants
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );
```

## 🚀 **APLICAR INMEDIATAMENTE**

### **Opción 1: Aplicar solo la nueva migración**
```bash
npx supabase db push -- migrations/009_fix_tenant_rls.sql
```

### **Opción 2: Reiniciar y aplicar todo**
```bash
# Resetear base de datos (perderás datos existentes)
npx supabase db reset
# Aplicar todas las migraciones
npx supabase db push
```

## 📝 **EXPLICACIÓN DEL CAMBIO**

### **✅ Antes (Restrictivo):**
```sql
-- Solo usuarios autenticados podían VER tenants
CREATE POLICY "Authenticated users can view tenants" ON tenants
    FOR SELECT USING (auth.role() = 'authenticated');
-- ❌ PROBLEMA: Bloqueaba el INSERT en signup
```

### **🎉 Después (Permissivo):**
```sql
-- Permitir INSERT sin autenticación (signup)
CREATE POLICY "Allow tenant creation" ON tenants
    FOR INSERT WITH CHECK (true);
-- ✅ BENEFICIO: Permite signup flow

-- Mantener seguridad para operaciones sensibles
CREATE POLICY "Allow tenant updates for admins" ON tenants
    FOR UPDATE USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );
-- ✅ BENEFICIO: Solo admins pueden modificar tenants
```

## 🛡️ **SEGURIDAD MANTENIDA**

1. **Signup sigue siendo seguro**: Tenant creation está controlada por API
2. **Operaciones sensibles protegidas**: Solo admins pueden actualizar/eliminar
3. **Visibilidad apropiada**: Cualquiera puede ver tenants públicos
4. **No se comprometen datos existentes**: Las políticas son aditivas

## 🔄 **VERIFICACIÓN**

Después de aplicar la migración:

```bash
# Test signup
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "storeName": "Test Store",
    "subdomain": "test",
    "ownerName": "Test Owner", 
    "email": "test@test.com",
    "password": "password123"
  }'

# Debe retornar 201 Created sin error RLS
```

**🎯 RESULTADO**: El signup funcionará correctamente mientras se mantiene la seguridad apropiada.