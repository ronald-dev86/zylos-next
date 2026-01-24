import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

// Schema de validación para actualizar rol
const updateRoleSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'vendedor', 'contador'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser: super_admin, admin, vendedor o contador' })
  })
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validar autenticación
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userId = params.id;

    // Parsear y validar request body
    const body = await request.json();
    const { role } = updateRoleSchema.parse(body);

    // Ejecutar actualización de rol usando el repository directamente
    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const userRepo = factory.getUserRepository();
    
    const updatedUser = await userRepo.updateRole(userId, role);

    return createSuccessResponse({
      user: updatedUser,
      message: 'Rol actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Users [id]/role PUT Error]', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Usuario no encontrado', 404);
    }
    
    return createErrorResponse('Error interno del servidor', 500);
  }
}