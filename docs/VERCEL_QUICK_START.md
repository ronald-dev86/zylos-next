# 🚀 Conexión Inmediata a Vercel - Paso a Paso

## 📋 PASO 1: Importar Repositorio

### **Acceder a Vercel:**
1. **Ve a**: [vercel.com](https://vercel.com)
2. **Login** con tu cuenta (GitHub/GitLab/Email)
3. **Dashboard → Add New... → Project**

### **Importar Repositorio:**
1. **Selecciona**: "Import Git Repository"
2. **Busca**: `zylos-next` (o el nombre de tu repo)
3. **Selecciona** tu repositorio
4. **Click**: "Import"

## 🏗️ PASO 2: Configuración Automática

Vercel detectará automáticamente:

```json
✅ Framework: Next.js
✅ Root Directory: . (detecta monorepo)
✅ Build Command: npm run build
✅ Output Directory: .next
✅ Install Command: npm install
```

### **NO CAMBIES NADA** - Deja la configuración por defecto

## 🔧 PASO 3: Environment Variables

### **Variables Globales (Root Project):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### **Configuración Individual:**
Vercel creará dos proyectos automáticamente (gracias a vercel.json):

1. **zylos-platform** → `platform.zylos.com`
2. **zylos-app** → `*.zylos.com`

Setea las variables por proyecto:

#### **Para zylos-platform:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_PLATFORM_URL=https://platform.zylos.com
NEXT_PUBLIC_APP_URL=https://zylos.com
```

#### **Para zylos-app:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://zylos.com
NEXT_PUBLIC_PLATFORM_URL=https://platform.zylos.com
```

## 🌐 PASO 4: Configurar Dominios

### **En Vercel Dashboard:**
1. **Project Settings → Domains**
2. **zylos-platform**: Agrega `platform.zylos.com`
3. **zylos-app**: Agrega `*.zylos.com`

### **DNS Configuration:**
```bash
# En tu proveedor de DNS:
*.zylos.com     → CNAME → cname.vercel-dns.com
platform.zylos.com → CNAME → cname.vercel-dns.com
```

## 🚀 PASO 5: Deploy!

### **Automatic Deploy:**
1. **Click**: "Deploy" (o se activará automáticamente)
2. **Espera**: Build y deployment (2-3 minutos)
3. **Resultado**: Dos URLs funcionando

### **URLs Finales:**
- **Platform**: `https://platform.zylos.com`
- **ERP App**: `https://tenant.zylos.com` (cualquier subdominio)

## 🧪 Testing Post-Deploy

### **1. Test Platform:**
```bash
# Visita:
https://platform.zylos.com

# Debe mostrar: Landing page con signup/login
```

### **2. Test Tenant Creation:**
```bash
# En platform.zylos.com/signup:
1. Crea nuevo tenant
2. Recibirás redirect a: tenant.zylos.com
3. Debe funcionar el dashboard del ERP
```

### **3. Test Tenant Isolation:**
```bash
# Crea 2 tenants diferentes:
- tienda1.zylos.com
- tienda2.zylos.com

# Deben estar completamente aislados
```

## 🚨 Troubleshooting

### **Si el build falla:**
```bash
# Verifica:
- Environment variables correctas
- Supabase project activo
- Sin errores de sintaxis en código
```

### **Si los dominios no funcionan:**
```bash
# Verifica DNS:
nslookup platform.zylos.com
nslookup test.zylos.com

# Debe apuntar a Vercel CNAMEs
```

### **Si el auth no funciona:**
```bash
# Revisa:
- NEXT_PUBLIC_SUPABASE_URL correcta
- SUPABASE_SERVICE_ROLE_KEY válido
- RLS policies habilitadas en BD
```

## 📊 Dashboard Vercel

Una vez deployado, monitorea:

1. **Functions Tab**: Logs de APIs
2. **Deployments Tab**: Historial de deploys
3. **Analytics**: Tráfico y rendimiento
4. **Settings**: Configuración adicional

## 🎉 ¡Éxito!

Si todo funciona correctamente:

```bash
✅ Platform funcional: platform.zylos.com
✅ Tenant creation funcionando
✅ ERP app funcionando: tenant.zylos.com
✅ Aislamiento de datos funcionando
✅ Multi-tenancy completo
```

**¡Felicidades! Tu ERP multi-tenant está en producción!** 🚀

---

## 📞 Si necesitas ayuda:

1. **Verifica logs** en Vercel Dashboard
2. **Revisa esta guía** paso por paso
3. **Consulta**: `docs/VERCEL_DEPLOYMENT.md` para detalles avanzados

**El sistema está diseñado para ser plug-and-play en Vercel.**