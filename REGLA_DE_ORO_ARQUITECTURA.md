# 🏗️ REGLA DE ORO ARQUITECTÓNICA - ZYLOS ERP

## 📜 PRINCIPIO FUNDAMENTAL

**La conexión a Supabase debe permanecer exclusivamente en el servidor. El cliente no debe tener acceso directo a la base de datos bajo ninguna circunstancia.**

---

## 🎯 OBJETIVO

Garantizar una arquitectura segura, mantenible y escalable siguiendo los principios de Clean Architecture y Domain-Driven Design (DDD).

---

## 📋 IMPLEMENTACIÓN OBLIGATORIA

### 1. **Supabase Solo en Servidor**
- ✅ Todas las conexiones a Supabase en `infrastructure/database/`
- ❌ Ningún cliente Supabase en el frontend
- ✅ API Routes como únicos puntos de acceso a datos

### 2. **Flujo de Comunicación**
```
Frontend → API Routes → Use Cases → Infrastructure → Database
           (Server)          (Clean)      (Supabase)
```

### 3. **Frontend "Tonto"**
- Solo consume APIs internas
- Sin lógica de negocio
- Sin conexión directa a Supabase
- Componentes puros de UI

### 4. **Backend con Responsabilidad**
- Maneja toda la lógica de negocio
- Gestiona la conexión a Supabase
- Implementa casos de uso con interfaces
- Aplica validaciones y seguridad

---

## 🗂️ ESTRUCTURA DE DIRECTORIOS

```
zylos/
├── src/
│   ├── app/api/                    # 🌐 API Routes (Server)
│   │   ├── auth/                  # Endpoints de autenticación
│   │   ├── users/                 # CRUD de usuarios
│   │   ├── products/              # CRUD de productos
│   │   └── dashboard/             # Datos del dashboard
│   ├── core/
│   │   ├── domain/                # 🎯 Entidades y servicios de dominio
│   │   ├── usecases/              # 📋 Casos de uso con interfaces
│   │   └── interfaces/            # 🔌 Contratos y tipos
│   ├── infrastructure/
│   │   ├── database/              # 🗄️ CONEXIÓN A SUPABASE (ÚNICO LUGAR)
│   │   │   ├── client.ts         # Cliente Supabase
│   │   │   ├── repositories/      # Implementación de repositorios
│   │   │   └── migrations/       # 📋 Schema SQL (ubicación correcta)
│   │   └── external/              # APIs externas
│   └── shared/
│       ├── components/            # 🎨 Componentes UI
│       ├── contexts/              # 📚 Contextos (sin Supabase client)
│       └── utils/                 # 🛠️ Utilidades frontend
```

---

## 🚫 PROHIBIDO EN CLIENTE

```typescript
// ❌ NUNCA HACER ESTO EN FRONTEND
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, key) // PROHIBIDO
```

```typescript
// ❌ CONTEXTOS SIN CONEXIÓN DIRECTA
const AuthContext = () => {
  const supabase = createClient() // PROHIBIDO
}
```

---

## ✅ CORRECTO EN SERVIDOR

```typescript
// ✅ SOLO EN INFRASTRUCTURE/DATABASE
// infrastructure/database/client.ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)
```

```typescript
// ✅ API ROUTES USAN INFRASTRUCTURE
// app/api/users/route.ts
import { UserRepository } from '@/infrastructure/database/repositories/UserRepository'
import { GetUsersUseCase } from '@/core/usecases/GetUsersUseCase'

export async function GET() {
  const userRepo = new UserRepository()
  const getUsersUseCase = new GetUsersUseCase(userRepo)
  return getUsersUseCase.execute()
}
```

```typescript
// ✅ FRONTEND SOLO CONSUME API
// components/UserList.tsx
export default function UserList() {
  const [users, setUsers] = useState([])
  
  useEffect(() => {
    fetch('/api/users') // ✅ CORRECTO
      .then(res => res.json())
      .then(data => setUsers(data))
  }, [])
  
  return /* UI */
}
```

---

## 🔥 BENEFICIOS

### **Seguridad**
- 🔐 Keys de Supabase nunca exuestas en cliente
- 🛡️ Control granular de acceso en servidor
- 🔒 SQL Injection prevenido en capa de servidor

### **Mantenibilidad**
- 📦 Separación clara de responsabilidades
- 🔧 Fácil testing unitario de casos de uso
- 🔄 Simple cambio de base de datos solo en infrastructure

### **Escalabilidad**
- 📈 Cache en servidor compartido
- 🚀 Optimización de queries centralizadas
- 🌐 Reducción de conexiones cliente-database

---

## 🎪 EJEMPLOS DE CASOS DE USO

### **Autenticación**
```typescript
// core/usecases/AuthenticateUserUseCase.ts
export interface IAuthenticateUserUseCase {
  execute(email: string, password: string): Promise<AuthResult>
}

export class AuthenticateUserUseCase implements IAuthenticateUserUseCase {
  constructor(private userRepo: IUserRepository) {}
  
  async execute(email: string, password: string) {
    // Lógica de negocio sin depender de Supabase directamente
    return await this.userRepo.authenticate(email, password)
  }
}
```

### **CRUD de Productos**
```typescript
// core/usecases/CreateProductUseCase.ts
export interface ICreateProductUseCase {
  execute(product: Product): Promise<Product>
}

export class CreateProductUseCase implements ICreateProductUseCase {
  constructor(private productRepo: IProductRepository) {}
  
  async execute(product: Product) {
    // Validaciones de negocio
    if (product.price <= 0) throw new Error('Invalid price')
    
    return await this.productRepo.create(product)
  }
}
```

---

## 📊 IMPLEMENTACIÓN ACTUAL

### **Estado Actual (Refactorización Necesaria)**
- ❌ AuthContext usa Supabase client directamente
- ❌ Componentes tienen lógica de base de datos
- ❌ Mezcla de responsabilidades

### **Estado Deseado (Post-Refactorización)**
- ✅ AuthContext solo consume `/api/auth/*`
- ✅ Componentes solo consumen APIs
- ✅ Separación limpia frontend-backend

---

## 🚀 PASOS DE MIGRACIÓN

1. **Crear capa de Infrastructure**
   - Mover conexión Supabase a `infrastructure/database/`
   - Implementar repositories pattern

2. **Refactorizar API Routes**
   - Crear casos de uso con interfaces
   - Implementar lógica de negocio en servidor

3. **Limpiar Frontend**
   - Remover todo Supabase client del cliente
   - Actualizar AuthContext para usar APIs
   - Componentes solo UI

4. **Testing**
   - Unit tests de casos de uso
   - Integration tests de API routes
   - E2E tests del flujo completo

---

## 🎖️ PRINCIPIOS APLICADOS

### **Clean Architecture**
- Capas bien definidas con dependencias correctas
- Inversión de dependencias
- Abstracciones sobre implementaciones

### **Domain-Driven Design**
- Entidades de dominio puras
- Casos de uso con interfaces
- Separación de dominio e infraestructura

### **Security First**
- Server-side data access
- Principle of least privilege
- Zero trust en el cliente

---

## 📝 RESUMEN

**REGLA DE ORO: Todo acceso a Supabase debe pasar por servidor mediante APIs internas. El frontend consume estas APIs como cualquier otro cliente.**

Esta arquitectura garantiza seguridad, mantenibilidad y escalabilidad del sistema Zylos ERP Multi-tenant.

---

*Documento arquitectónico fundamental del proyecto Zylos - Actualizado 2026-01-21*