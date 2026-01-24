import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['super_admin', 'admin', 'vendedor', 'contador'], {
    message: 'Rol inválido. Opciones: super_admin, admin, vendedor, contador'
  })
});

export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const authResult = validateAuthCookie(request);
    
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    // Verificar permisos (solo admin o super_admin pueden crear usuarios)
    const userRole = authResult.user?.role;
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return createErrorResponse('Permisos insuficientes', 403, {
        requiredRole: 'admin o super_admin',
        currentRole: userRole
      });
    }

    // Parsear y validar request body
    const body = await request.json();
    const { email, role } = createUserSchema.parse(body);

    // Generar contraseña temporal
    const tempPassword = generateTempPassword();

    // Obtener repositorio con contexto del tenant
    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const userRepo = factory.getUserRepository();

    // Verificar si el email ya existe en el tenant
    const existingUser = await userRepo.findByEmail(email);
    if (existingUser) {
      return createErrorResponse('El email ya está en uso', 409, { email });
    }

    // Crear usuario usando el método createWithAuth (maneja Supabase Auth + Database)
    const newUser = await userRepo.createWithAuth({
      email,
      password: tempPassword,
      role,
      tenantId: authResult.tenant!.id
    });

    if (!newUser) {
      return createErrorResponse('Error al crear usuario', 500);
    }

    return createSuccessResponse({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        tenantId: newUser.tenantId,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      },
      temporaryPassword: tempPassword,
      message: 'Usuario creado exitosamente. La contraseña temporal debe ser cambiada en el primer inicio de sesión.',
      requiresPasswordChange: true
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.issues);
    }

    console.error('[API Create User Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/users/create',
    method: 'POST',
    description: 'Crear nuevo usuario en el tenant actual',
    authentication: 'Required (httpOnly cookie)',
    authorization: 'Solo admin o super_admin',
    usage: {
      body: {
        email: 'string (required) - Email del nuevo usuario',
        role: 'string (required) - Rol: super_admin, admin, vendedor, contador'
      }
    },
    responses: {
      200: {
        description: 'Usuario creado exitosamente',
        body: {
          success: true,
          data: {
            user: {
              id: 'string',
              email: 'string',
              role: 'string',
              tenantId: 'string',
              createdAt: 'string',
              updatedAt: 'string'
            },
            temporaryPassword: 'string',
            message: 'string',
            requiresPasswordChange: true
          }
        }
      },
      400: {
        description: 'Datos inválidos'
      },
      401: {
        description: 'No autenticado'
      },
      403: {
        description: 'Permisos insuficientes'
      },
      409: {
        description: 'Email ya existe'
      }
    },
    examples: [
      {
        request: {
          method: 'POST',
          url: '/api/users/create',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': 'zylos_auth=...'
          },
          body: {
            email: 'nuevo@ejemplo.com',
            role: 'vendedor'
          }
        },
        response: {
          success: true,
          data: {
            user: {
              id: 'uuid-nuevo',
              email: 'nuevo@ejemplo.com',
              role: 'vendedor',
              tenantId: 'tenant-actual',
              createdAt: '2026-01-21T00:00:00Z',
              updatedAt: '2026-01-21T00:00:00Z'
            },
            temporaryPassword: 'Kj9#mN2@xP4',
            message: 'Usuario creado exitosamente. La contraseña temporal debe ser cambiada en el primer inicio de sesión.',
            requiresPasswordChange: true
          }
        }
      }
    ],
    security: [
      {
        type: 'httpOnly',
        scheme: 'cookie',
        name: 'zylos_auth'
      }
    ],
    notes: [
      'Se genera automáticamente una contraseña temporal segura de 12 caracteres',
      'El nuevo usuario debe cambiar la contraseña en el primer inicio',
      'Solo usuarios con rol admin o super_admin pueden crear nuevos usuarios',
      'El email no puede existir previamente en el mismo tenant'
    ]
  });
}