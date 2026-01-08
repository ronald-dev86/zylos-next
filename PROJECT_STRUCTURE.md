# 📋 Zylos ERP/POS - Estructura del Proyecto

## 🏗️ **Arquitectura General**

```
zylos/
├── 📁 supabase/                    # Base de datos (Source of Truth)
│   ├── 📁 migrations/              # Migraciones SQL (001-010)
│   └── 📁 seed/                   # Datos iniciales
├── 📁 src/                        # Código fuente TypeScript
│   ├── 📁 app/                    # Next.js App Router
│   ├── 📁 core/                   # Lógica de Negocio (Clean Architecture)
│   ├── 📁 infrastructure/         # Conexiones y APIs externas
│   ├── 📁 lib/                    # Utilidades de librerías
│   ├── 📁 shared/                 # Componentes y tipos comunes
│   └── 📄 middleware.ts            # Middleware de tenant routing
├── 📄 package.json               # Dependencias y scripts
├── 📄 .env.local                # Variables de entorno
└── 📄 README.md                 # Documentación
```

---

## 📂 **Estructura Detallada**

### **🌐 App Router (/src/app/)**
```
app/
├── 📁 api/                       # API Routes
│   ├── 📁 fix-duplicates/         # Limpieza de usuarios duplicados
│   ├── 📁 suppliers/[id]/         # CRUD de proveedores
│   ├── 📁 tenants/               # Gestión de tenants
│   ├── 📁 test-headers/          # Testing de headers
│   └── 📁 test-registration/     # Testing de registro
├── 📁 auth/                      # Autenticación
│   ├── 📄 layout.tsx            # Layout de auth
│   ├── 📄 login/page.tsx         # Formulario de login
│   └── 📄 register/page.tsx      # Formulario de registro
├── 📄 dashboard/page.tsx          # Dashboard principal
├── 📄 suppliers/page.tsx          # Gestión de proveedores
├── 📄 test-registration/page.tsx   # Dashboard de testing
└── 📄 layout.tsx                 # Root layout con AuthProvider
```

### **🧠 Core Business Logic (/src/core/)**
```
core/
├── 📁 domain/                    # Entidades puras
│   ├── 📄 Customer.ts            # Entidad Cliente
│   ├── 📄 InventoryMovement.ts   # Movimientos de inventario
│   ├── 📄 LedgerEntry.ts        # Entradas del libro mayor
│   ├── 📄 Product.ts            # Entidad Producto
│   ├── 📄 Supplier.ts          # Entidad Proveedor
│   ├── 📄 Tenant.ts            # Entidad Tenant
│   └── 📄 User.ts              # Entidad Usuario
├── 📁 services/                  # Interfaces de repositorios
│   ├── 📄 ICustomerRepository.ts
│   ├── 📄 IInventoryMovementRepository.ts
│   ├── 📄 ILedgerEntryRepository.ts
│   ├── 📄 IProductRepository.ts
│   ├── 📄 ISupplierRepository.ts
│   ├── 📄 ITenantRepository.ts
│   └── 📄 IUserRepository.ts
└── 📁 use-cases/                # Casos de uso (lógica de negocio)
    ├── 📄 AuthService.ts        # Autenticación y registro
    ├── 📄 CustomerService.ts    # Gestión de clientes
    ├── 📄 InventoryService.ts   # Control de inventario
    ├── 📄 LedgerService.ts      # Gestión financiera
    ├── 📄 ProductService.ts     # Catálogo de productos
    ├── 📄 SupplierService.ts    # Proveedores
    ├── 📄 TenantService.ts      # Gestión de tenants
    └── 📄 UserService.ts       # Gestión de usuarios
```

### **🔧 Infrastructure (/src/infrastructure/)**
```
infrastructure/
├── 📁 database/                   # Implementaciones de repositorios
│   ├── 📄 LedgerEntryRepository.ts
│   ├── 📄 SupabaseTenantRepository.ts
│   └── 📄 SupplierRepository.ts
└── 📁 supabase-client/           # Cliente legacy
    └── 📄 client.ts
```

### **🛠️ Librerías (/src/lib/)**
```
lib/
├── 📁 supabase/                 # Clientes Supabase optimizados
│   ├── 📄 client.ts             # Browser client
│   └── 📄 server.ts             # Server client con cookies
├── 📄 utils.ts                  # Utilidades generales
└── 📄 supabase-client/          # Legacy client
```

### **🎨 Shared Components (/src/shared/)**
```
shared/
├── 📁 components/                # Componentes reutilizables
│   ├── 📄 Button.tsx
│   ├── 📄 Card.tsx
│   ├── 📄 Input.tsx
│   └── 📄 index.ts
├── 📁 hooks/                    # Hooks personalizados
│   └── 📄 index.ts             # useAsyncData, usePagination
├── 📁 types/                    # Tipos TypeScript
│   ├── 📄 common.ts            # Tipos comunes
│   ├── 📄 database.ts          # Schema de Supabase
│   └── 📄 schemas.ts           # Schemas de Zod
├── 📁 utils/                    # Utilidades
│   └── 📄 index.ts
└── 📁 validators/               # Validadores
    └── 📄 api-schemas.ts       # Schemas de API
```

### **🎮 Componentes UI (/src/components/)**
```
components/
├── 📁 auth/                      # Componentes de autenticación
│   ├── 📄 AuthGuard.tsx        # Protección de rutas
│   ├── 📄 LoginForm.tsx        # Formulario de login
│   ├── 📄 ProtectedRoute.tsx   # Rutas protegidas
│   └── 📄 RegisterForm.tsx     # Formulario de registro
└── 📁 ui/                        # Componentes UI base
    ├── 📄 alert.tsx            # Componente de alertas
    ├── 📄 button.tsx           # Botón estilizado
    ├── 📄 card.tsx             # Componente card
    ├── 📄 checkbox.tsx         # Checkbox personalizado
    ├── 📄 input.tsx            # Input field
    ├── 📄 label.tsx            # Etiqueta de formulario
    └── 📄 spinner.tsx          # Loading spinner
```

### **🗄️ Base de Datos (/supabase/)**
```
supabase/
├── 📁 migrations/                     # Migraciones en orden
│   ├── 📄 001_initial_schema.sql       # Schema base
│   ├── 📄 002_business_functions.sql    # Funciones de negocio
│   ├── 📄 003_seed_data.sql           # Datos de prueba
│   ├── 📄 004_test_functions.sql       # Tests SQL
│   ├── 📄 005_add_tenant_active.sql    # Campo active a tenants
│   ├── 📄 006_rls_policies.sql         # Políticas RLS
│   ├── 📄 007_debug_functions.sql      # Funciones de debug
│   ├── 📄 008_registration_test.sql    # Test de registro
│   ├── 📄 009_debug_duplicate_users.sql # Debug duplicados
│   └── 📄 010_fix_duplicate_users.sql  # Reparación duplicados
└── 📁 seed/                           # Datos iniciales
    └── 📄 001_seed_data.sql
```

---

## 🎯 **Patrones de Arquitectura**

### **📦 Clean Architecture**
- **Domain**: Entidades puras sin dependencias externas
- **Use Cases**: Lógica de negocio orquestando entities
- **Infrastructure**: Implementaciones concretas (Supabase, APIs)
- **Presentation**: UI components y routes

### **🔐 Multi-tenancy**
- Middleware detecta subdominio (`tenant.zylos.com`)
- Headers de contexto: `x-tenant-id`, `x-user-role`
- RLS policies a nivel de base de datos
- JWT claims con tenant information

### **🛡️ Seguridad (RLS)**
- Todas las tablas con Row Level Security
- Aislamiento por tenant_id obligatorio
- RBAC con roles: super_admin, admin, vendedor, contador
- Validación con Zod en todos los endpoints

### **🔄 Data Flow**
1. **Request** → Middleware (tenant detection)
2. **Auth** → AuthService (validation)
3. **Business** → Use Cases (domain logic)
4. **Persistence** → Repositories (database)
5. **Response** → UI Components

---

## 📋 **Flujo de Registro (Ejemplo)**

```
RegisterForm.tsx
    ↓ (userData)
AuthService.register()
    ↓
1. Validar schema con Zod
2. Crear tenant en BD
3. Crear usuario en Supabase Auth
    ↓ (trigger)
handle_new_user() → Insert en tabla users
    ↓
Respuesta con tenant_id y role='admin'
```

---

## 🔍 **Principios Clave**

✅ **Zero Hardcoding**: Todo dinámico por dominio/sesión  
✅ **Atomic Operations**: Funciones BD para transacciones críticas  
✅ **Type Safety**: TypeScript strict + Zod validation  
✅ **Isolation**: RLS obligatorio + tenant routing  
✅ **Scalability**: Middleware edge + Optimized queries  

Esta estructura permite escabilidad masiva, mantenibilidad y seguridad total para el ERP/POS multi-tenant Zylos.