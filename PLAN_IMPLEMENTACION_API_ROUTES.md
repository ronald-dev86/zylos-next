# 🚀 PLAN DETALLADO - IMPLEMENTACIÓN DE API ROUTES

Basado en nuestro estado actual (98% completado), vamos a implementar las API routes siguiendo Clean Architecture y la Regla de Oro.

---

## 🎯 **ARQUITECTURA DE API ROUTES**

### **📁 Estructura a Implementar**
```
src/app/api/
├── auth/
│   ├── login/route.ts           # 🔥 POST - Autenticación
│   ├── logout/route.ts          # POST - Cierre de sesión  
│   ├── me/route.ts              # GET - Estado actual del usuario
│   └── refresh/route.ts         # POST - Refrescar token
├── users/
│   ├── route.ts                 # GET - Listar usuarios (paginado)
│   ├── [id]/route.ts           # GET/PUT/DELETE - CRUD individual
│   └── create/route.ts          # POST - Crear usuario
├── products/
│   ├── route.ts                 # GET - Listar productos (paginado)
│   ├── [id]/route.ts           # GET/PUT/DELETE - CRUD
│   ├── create/route.ts          # POST - Crear producto
│   └── search/route.ts          # GET - Búsqueda por nombre
├── dashboard/
│   ├── stats/route.ts            # GET - Estadísticas generales
│   ├── users/route.ts            # GET - Datos de usuarios para dashboard
│   └── recent-sales/route.ts      # GET - Ventas recientes
└── health/
    └── route.ts                 # GET - Health check del sistema
```

---

## 🔥 **PRIORIDAD 1 - AUTENTICACIÓN**

### **📋 app/api/auth/login/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthenticateUserUseCase } from '@/core/usecases/AuthenticateUserUseCase';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { ValidationError, InvalidCredentialsError } from '@/shared/errors/ApplicationError';
import { createErrorResponse, createSuccessResponse } from '@/shared/utils/api-response';

// Schema de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
  subdomain: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    // Parsear y validar request
    const body = await request.json();
    const { email, password, subdomain } = loginSchema.parse(body);
    
    // Detectar tenant desde subdominio o request
    const hostname = request.headers.get('host') || '';
    const detectedSubdomain = extractSubdomain(hostname);
    const finalSubdomain = subdomain || detectedSubdomain;
    
    if (!finalSubdomain) {
      return createErrorResponse('No se pudo detectar el subdominio', 400);
    }
    
    // Ejecutar use case de autenticación
    const factory = RepositoryFactory.getInstance(finalSubdomain);
    const userRepo = factory.getUserRepository();
    const tenantRepo = factory.getTenantRepository();
    
    const authenticateUseCase = new AuthenticateUserUseCase(userRepo, tenantRepo);
    
    const result = await authenticateUseCase.execute({
      email,
      password,
      subdomain: finalSubdomain
    });
    
    if (!result.success) {
      return createErrorResponse(result.error || 'Autenticación fallida', 401);
    }
    
    // Establecer cookie httpOnly
    const response = createSuccessResponse({
      success: true,
      user: result.user,
      tenant: result.tenant,
      redirectUrl: '/dashboard'
    });
    
    // Cookie con 7 días de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    response.cookies.set('zylos_auth', JSON.stringify({
      token: result.token,
      user: result.user,
      tenant: result.tenant,
      expiresAt: expiresAt.toISOString()
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 días
      path: '/'
    });
    
    return response;
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }
    
    if (error instanceof InvalidCredentialsError) {
      return createErrorResponse('Credenciales inválidas', 401);
    }
    
    console.error('[API Login Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0];
  }
  return null;
}
```

### **📋 app/api/auth/me/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateAuthCookie } from '@/shared/utils/auth-validation';

export async function GET(request: NextRequest) {
  try {
    const authResult = validateAuthCookie(request);
    
    if (!authResult.isValid) {
      return NextResponse.json(
        { error: 'No autenticado', details: authResult.error },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      success: true,
      user: authResult.user,
      tenant: authResult.tenant,
      isAuthenticated: true
    });
    
  } catch (error) {
    console.error('[API Me Error]', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
```

### **📋 app/api/auth/logout/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
  
  // Eliminar cookie
  response.cookies.set('zylos_auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/'
  });
  
  return response;
}
```

---

## 🔧 **USE CASES A IMPLEMENTAR**

### **📋 core/usecases/AuthenticateUserUseCase.ts**
```typescript
import { IUserRepository } from '@/core/services/IUserRepository';
import { ITenantRepository } from '@/core/services/ITenantRepository';
import { User } from '@/core/entities/User';
import { Tenant } from '@/core/entities/Tenant';
import { InvalidCredentialsError, TenantNotFoundError } from '@/shared/errors/ApplicationError';

interface AuthenticateUserDTO {
  email: string;
  password: string;
  subdomain: string;
}

interface AuthenticateUserResult {
  success: boolean;
  user?: User;
  tenant?: Tenant;
  token?: string;
  error?: string;
}

export class AuthenticateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tenantRepository: ITenantRepository
  ) {}

  async execute(data: AuthenticateUserDTO): Promise<AuthenticateUserResult> {
    try {
      // 1. Validar que el tenant exista y esté activo
      const tenant = await this.tenantRepository.findBySubdomain(data.subdomain);
      if (!tenant || !tenant.isActive) {
        return {
          success: false,
          error: 'Tenant no encontrado o inactivo'
        };
      }

      // 2. Buscar usuario por email y tenant
      const user = await this.userRepo.findByEmailAndTenant(data.email, tenant.id);
      if (!user) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // 3. Validar password (usando Supabase auth)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error || !data.session) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // 4. Retornar éxito con datos del usuario
      return {
        success: true,
        user,
        tenant,
        token: data.session.access_token
      };

    } catch (error) {
      console.error('[AuthenticateUserUseCase Error]', error);
      return {
        success: false,
        error: 'Error en la autenticación'
      };
    }
  }
}
```

---

## 🔧 **UTILIDADES COMPARTIDAS**

### **📋 shared/utils/api-response.ts**
```typescript
import { NextResponse } from 'next/server';

export function createSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status });
}

export function createErrorResponse(
  message: string, 
  status: number = 400, 
  details?: any
): NextResponse {
  return NextResponse.json({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  }, { status });
}
```

### **📋 shared/utils/auth-validation.ts**
```typescript
import { NextRequest } from 'next/server';
import { User } from '@/core/entities/User';
import { Tenant } from '@/core/entities/Tenant';

interface AuthValidationResult {
  isValid: boolean;
  user?: User;
  tenant?: Tenant;
  token?: string;
  error?: string;
}

export function validateAuthCookie(request: NextRequest): AuthValidationResult {
  const authCookie = request.cookies.get('zylos_auth');
  
  if (!authCookie) {
    return { isValid: false, error: 'No auth cookie' };
  }
  
  try {
    const authData = JSON.parse(atob(authCookie.value));
    
    if (!authData?.user || !authData?.tenant || !authData?.token) {
      return { isValid: false, error: 'Invalid auth structure' };
    }
    
    // Validar expiración
    if (authData.expiresAt && new Date(authData.expiresAt) < new Date()) {
      return { isValid: false, error: 'Token expired' };
    }
    
    return {
      isValid: true,
      user: authData.user,
      tenant: authData.tenant,
      token: authData.token
    };
    
  } catch (error) {
    return { isValid: false, error: 'Cookie parse error' };
  }
}
```

---

## 🚀 **ORDEN DE IMPLEMENTACIÓN**

### **📅 Día 1 - Fundación**
1. **Crear utilidades base** (`api-response.ts`, `auth-validation.ts`)
2. **Implementar `AuthenticateUserUseCase`** 
3. **Crear `POST /api/auth/login`**
4. **Crear `GET /api/auth/me`**
5. **Crear `POST /api/auth/logout`**

### **📅 Día 2 - CRUD de Usuarios**
1. **Implementar `GetUsersUseCase`**
2. **Crear `GET /api/users`** (paginación)
3. **Implementar `CreateUserUseCase`**
4. **Crear `POST /api/users/create`**
5. **Crear `GET /api/users/[id]`**

### **📅 Día 3 - Dashboard y Productos**
1. **Implementar `GetDashboardStatsUseCase`**
2. **Crear `GET /api/dashboard/stats`**
3. **Implementar `GetProductsUseCase`**
4. **Crear `GET /api/products`**
5. **Testing y validación**

---

## 🧪 **ESTRATEGIA DE TESTING**

### **📋 Unit Tests**
```typescript
// __tests__/core/usecases/AuthenticateUserUseCase.test.ts
import { AuthenticateUserUseCase } from '@/core/usecases/AuthenticateUserUseCase';

describe('AuthenticateUserUseCase', () => {
  it('should authenticate user with valid credentials', async () => {
    // Test implementation
  });
  
  it('should reject invalid credentials', async () => {
    // Test implementation
  });
  
  it('should reject inactive tenant', async () => {
    // Test implementation
  });
});
```

### **📋 Integration Tests**
```typescript
// __tests__/api/auth/login.test.ts
import { createMockRequest } from '@/tests/utils/mock-request';

describe('/api/auth/login', () => {
  it('should return 200 with valid credentials', async () => {
    // Integration test implementation
  });
  
  it('should return 401 with invalid credentials', async () => {
    // Integration test implementation
  });
});
```

---

## 🎯 **MÉTRICAS DE ÉXITO**

### **✅ Criterios de Completación**
- [ ] **Auth APIs** funcionando con httpOnly cookies
- [ ] **CRUD Users** con paginación
- [ ] **Dashboard APIs** con estadísticas
- [ ] **Use Cases** implementados correctamente
- [ ] **Validaciones** con Zod schemas
- [ ] **Error handling** con ApplicationError
- [ ] **Testing** unitario e integración
- [ ] **TypeScript** 100% tipado

### **📊 Tiempos Estimados**
- **Día 1:** 4-6 horas (auth foundation)
- **Día 2:** 3-4 horas (user CRUD)
- **Día 3:** 3-4 horas (dashboard/products)
- **Testing:** 2-3 horas (unit + integration)

---

## 🚀 **ESTADO DE IMPLEMENTACIÓN**

### **📋 Checklist de Progreso**
- [ ] **Utilidades base creadas**
- [ ] **AuthenticateUserUseCase implementado**
- [ ] **POST /api/auth/login** funcionando
- [ ] **GET /api/auth/me** funcionando
- [ ] **POST /api/auth/logout** funcionando
- [ ] **User CRUD** completado
- [ ] **Dashboard APIs** implementadas
- [ ] **Product APIs** funcionando
- [ ] **Unit tests** escritos
- [ ] **Integration tests** funcionando
- [ ] **TypeScript** sin errores
- [ ] **Testing en desarrollo** probado

### **🔄 ESTADO ACTUAL:**
- **Implementación:** Esperando confirmación para comenzar
- **Documentación:** 100% completa y detallada
- **Arquitectura:** Definida según Clean Architecture
- **Principios:** Cumple con Regla de Oro y DDD
- **Métricas:** Criterios de éxito establecidos

---

## 🎯 **PRÓXIMOS PASOS**

### **🔥 Para comenzar la implementación:**

1. **Confirmar el plan** (si estás de acuerdo)
2. **Crear estructura de directorios** en `src/app/api/`
3. **Implementar utilidades base** (`api-response.ts`, `auth-validation.ts`)
4. **Crear el primer Use Case** (`AuthenticateUserUseCase`)
5. **Implementar primera API** (`POST /api/auth/login`)

### **📋 Herramientas y dependencias necesarias:**
```json
{
  "dependencies": {
    "zod": "^3.22.4",
    "@types/supertest": "^2.0.12",
    "supertest": "^6.3.3"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

### **🧪 Configuración de testing:**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/tests/**/*.(test|spec).(js|ts|tsx)'
  ]
};
```

---

## 🎊 **CONCLUSIÓN**

**📋 Plan completamente documentado y listo para implementación:**

1. ✅ **Arquitectura definida** según Clean Architecture
2. ✅ **Use Cases diseñados** con interfaces claras
3. ✅ **API Routes estructuradas** con validaciones
4. ✅ **Testing strategy** unitario e integración
5. ✅ **Métricas de éxito** claramente establecidas
6. ✅ **Regla de Oro cumplida** en todos los componentes

**🚀 ESTAMOS LISTOS PARA COMENZAR LA IMPLEMENTACIÓN**

**¿Procedemos con la creación del primer Use Case (`AuthenticateUserUseCase`) y la API de autenticación?**