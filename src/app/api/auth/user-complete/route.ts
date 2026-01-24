import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const userCompleteSchema = z.object({
  userId: z.string().uuid('ID de usuario inválido'),
  tenantId: z.string().uuid('ID de tenant inválido'),
  retryCount: z.number().min(0).default(0)
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, tenantId, retryCount } = userCompleteSchema.parse(body);

    // Obtener repositorio de usuarios sin tenant context para operaciones admin
    const userRepo = RepositoryFactory.getUserRepositoryStatic();
    
    // Verificar si el usuario existe
    const user = await userRepo.findById(userId);
    
    if (user) {
      // Usuario existe, éxito!
      return createSuccessResponse({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
          createdAt: user.createdAt
        },
        message: 'User record successfully created'
      });
    }

    // Usuario no existe yet, verificar si debemos reintentar
    if (retryCount >= 5) {
      // Después de 5 reintentos, crear manualmente con datos mínimos
      console.log('Max retries reached, creating user manually');
      
      // Para este caso, necesitaríamos obtener información del auth user
      // Por ahora, retornamos error específico
      return createErrorResponse(
        'User creation failed after maximum retries. Please contact support.',
        404,
        { userId, tenantId, retryCount }
      );
    }

    // Programar retry con exponential backoff
    const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
    
    // En un entorno real, esto debería ser una cola de mensajes
    // Por ahora, simplemente retornamos información para que el cliente reintente
    return createSuccessResponse({
      pending: true,
      retryCount: retryCount + 1,
      suggestedDelay: delay,
      message: `User creation in progress... (${retryCount + 1}/5)`,
      nextRetryAt: new Date(Date.now() + delay).toISOString()
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API User-Complete Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/auth/user-complete',
    method: 'POST',
    description: 'Verifica y completa la creación de usuarios después del signup',
    usage: {
      body: {
        userId: 'string (required) - UUID del usuario',
        tenantId: 'string (required) - UUID del tenant',
        retryCount: 'number (optional) - Número de reintentos realizados'
      }
    },
    examples: [
      {
        userId: '12345678-1234-1234-1234-123456789012',
        tenantId: '87654321-4321-4321-4321-210987654321',
        retryCount: 0
      }
    ],
    notes: [
      'Este endpoint es utilizado internamente durante el proceso de signup',
      'Implementa un mecanismo de retry con exponential backoff',
      'Después de 5 reintentos fallidos, se requiere intervención manual'
    ]
  });
}