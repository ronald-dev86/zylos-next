import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';

const emailSchema = z.string().email('Email inválido');

export async function GET(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    // Validar autenticación
    const authResult = validateAuthCookie(request);
    
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    // Validar parámetro email
    const emailValidation = emailSchema.safeParse(params.email);
    if (!emailValidation.success) {
      return createErrorResponse('Email inválido', 400, emailValidation.error.issues);
    }

    const email = emailValidation.data;

    // Obtener repositorio de usuarios con contexto del tenant
    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const userRepo = factory.getUserRepository();
    
    // Buscar usuario por email y tenant
    const user = await userRepo.findByEmail(email);
    
    if (!user) {
      return createErrorResponse('Usuario no encontrado', 404, { email });
    }

    // Verificar que el usuario pertenezca al mismo tenant del usuario autenticado
    if (user.tenantId !== authResult.tenant!.id) {
      return createErrorResponse('Acceso denegado', 403, {
        message: 'El usuario no pertenece a este tenant'
      });
    }

    return createSuccessResponse({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      found: true
    });

  } catch (error) {
    console.error('[API Users By Email Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/users/by-email/[email]',
    method: 'GET',
    description: 'Buscar usuario por email dentro del tenant actual',
    authentication: 'Required (httpOnly cookie)',
    authorization: 'Solo usuarios del mismo tenant',
    usage: {
      params: {
        email: 'string (required) - Email del usuario a buscar'
      }
    },
    responses: {
      200: {
        description: 'Usuario encontrado exitosamente',
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
            found: true
          }
        }
      },
      400: {
        description: 'Email inválido'
      },
      401: {
        description: 'No autenticado'
      },
      403: {
        description: 'Usuario no pertenece al tenant actual'
      },
      404: {
        description: 'Usuario no encontrado'
      }
    },
    examples: [
      {
        request: {
          method: 'GET',
          url: '/api/users/by-email/juan@example.com',
          headers: {
            'Cookie': 'zylos_auth=...'
          }
        },
        response: {
          success: true,
          data: {
            user: {
              id: 'uuid-123',
              email: 'juan@example.com',
              role: 'vendedor',
              tenantId: 'tenant-456',
              createdAt: '2026-01-21T00:00:00Z',
              updatedAt: '2026-01-21T00:00:00Z'
            },
            found: true
          }
        }
      }
    ]
  });
}