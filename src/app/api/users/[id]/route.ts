import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { UpdateUserUseCase } from '@/core/usecases/UpdateUserUseCase';
import { DeleteUserUseCase } from '@/core/usecases/DeleteUserUseCase';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

// Schema de validación para actualizar usuario
const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  role: z.enum(['super_admin', 'admin', 'vendedor', 'contador']).optional()
}).refine(data => data.email || data.role, {
  message: 'Debe proporcionar al menos un campo para actualizar (email o role)'
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validar autenticación
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userId = params.id;

    // Obtener usuario específico
    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const userRepo = factory.getUserRepository();
    
    const user = await userRepo.findById(userId);
    
    if (!user) {
      return createErrorResponse('Usuario no encontrado', 404);
    }

    return createSuccessResponse({ user });

  } catch (error) {
    console.error('[API Users [id] GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

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
    const updateData = updateUserSchema.parse(body);

    // Ejecutar use case
    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const userRepo = factory.getUserRepository();
    
    const updateUserUseCase = new UpdateUserUseCase(userRepo);
    
    const result = await updateUserUseCase.execute({
      id: userId,
      ...updateData
    });

    if (!result.success) {
      return createErrorResponse(result.error || 'Error al actualizar usuario', 400);
    }

    return createSuccessResponse({
      user: result.user,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Users [id] PUT Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Validar autenticación
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userId = params.id;

    // Ejecutar use case
    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const userRepo = factory.getUserRepository();
    
    const deleteUserUseCase = new DeleteUserUseCase(userRepo);
    
    const result = await deleteUserUseCase.execute({
      id: userId
    });

    if (!result.success) {
      return createErrorResponse(result.error || 'Error al eliminar usuario', 400);
    }

    return createSuccessResponse({
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('[API Users [id] DELETE Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}