# 🚀 Vercel Deployment Guide

## 📋 Overview

Este monorepo está configurado para deployment en Vercel con dos proyectos separados:

- **zylos-platform** → `platform.zylos.com` (Landing + Auth + Tenant Management)
- **zylos-app** → `*.zylos.com` (ERP Core for Tenants)

## 🔧 Configuración en Vercel

### 1. Conectar Repositorio a Vercel

```bash
# En Vercel Dashboard:
# 1. Import Git Repository
# 2. Seleccionar: zylos (monorepo)
# 3. Framework Preset: Next.js
# 4. Build Settings: Usar vercel.json
```

### 2. Configurar DNS

```
# En tu proveedor de DNS:
*.zylos.com     → CNAME → cname.vercel-dns.com
platform.zylos.com → CNAME → cname.vercel-dns.com
```

### 3. Environment Variables

#### Variables Globales (Root Project):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

#### Variables por Proyecto:

**zylos-platform**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_PLATFORM_URL=https://platform.zylos.com
NEXT_PUBLIC_APP_URL=https://zylos.com
```

**zylos-app**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=https://zylos.com
NEXT_PUBLIC_PLATFORM_URL=https://platform.zylos.com
```

## 🔄 Deployment Workflow

### Development/Staging:
```bash
# Branch: develop → Auto-deploy a preview URLs
feature-xxx-platform.vercel.app
feature-xxx-app-tenant1.vercel.app
```

### Production:
```bash
# Branch: main → Deploy a dominios configurados
platform.zylos.com  ← zylos-platform
*.zylos.com         ← zylos-app
```

## ⚙️ Configuración Automática

El `vercel.json` en el root configura:

1. **Proyectos Separados**: Cada app con su propio build
2. **Dominios Correctos**: Platform + wildcard para app
3. **Build Commands**: Scripts específicos por aplicación
4. **Output Directories**: `.next` de cada app

## 🧪 Testing Local

```bash
# Development simultáneo:
npm run dev

# Esto inicia:
# - apps/platform → http://localhost:3000
# - apps/app     → http://localhost:3001
```

## 🔒 Seguridad

- **Platform**: Usa SERVICE_ROLE_KEY para crear tenants
- **App**: Usa ANON_KEY con RLS para datos aislados
- **Middlewares**: Validan dominios y tenant context

## 🚨 Troubleshooting

### Build Errors:
```bash
# Verificar que workspace dependencies estén instaladas:
npm install

# Limpiar y rebuild:
npm run clean
npm run build
```

### Domain Issues:
```bash
# Verificar configuración DNS:
nslookup platform.zylos.com
nslookup tenant1.zylos.com

# Debe apuntar a Vercel's CNAME
```

### Environment Variables:
```bash
# Verificar que las variables estén en el lugar correcto:
# Globales → Root project settings
# App-specific → Individual project settings
```

## 📊 Monitoring

Vercel proporciona:
- **Build Logs**: Por cada deploy
- **Function Logs**: Para API routes
- **Analytics**: Tráfico y rendimiento
- **Speed Insights**: Core Web Vitals

## 🔄 Rollback

Si algo falla en producción:
```bash
# En Vercel Dashboard:
# 1. Ir a Deployments tab
# 2. Find working deployment
# 3. Click "..." → "Promote to Production"
```

## 🎛️ Configuración Avanzada

### Custom Domains Adicionales:
```bash
# Para clientes con dominio personalizado:
customer1.yourdomain.com → *.zylos.com (CNAME)
```

### Edge Functions:
```bash
# Los middlewares se ejecutan en el edge:
# - Validación de subdominios
# - Tenant resolution
# - Redirecciones
```

---

## 🚀 Ready for Production!

Una vez configurado, el flujo completo será:

1. **Usuario** → `platform.zylos.com`
2. **Signup** → Crea tenant + admin user
3. **Redirect** → `tenant.zylos.com/dashboard`
4. **ERP** → Sistema completo aislado

**El sistema está listo para producción escalable multi-tenant!** 🎉