# Zylos Platform

**Dominio**: platform.zylos.com  
**Propósito**: Landing page + creación de tenants + gestión de usuarios

## 🎯 Funcionalidades

### 🏠 Public
- Landing marketing
- Planes y pricing
- Documentación

### 🔐 Authentication  
- Signup de nuevos tenants
- Login global (redirección a subdominio)
- Recuperación de contraseñas

### 🏢 Tenant Management
- Creación de tenants
- Suspensión/activación
- Planes y billing

### 📊 Admin Dashboard
- Métricas multi-tenant
- Gestión global
- Reportes de plataforma

## 🛠️ Tech Stack
- Next.js 16 (App Router)
- Supabase (service role)
- Stripe (billing)
- Tailwind CSS + Shadcn/UI

## 🔗 APIs
- `/api/auth/signup` - Crear tenant + admin
- `/api/auth/login` - Login global
- `/api/tenants/*` - Gestión tenants
- `/api/billing/*` - Pagos

## 🚀 Deployment
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Custom Domain**: platform.zylos.com