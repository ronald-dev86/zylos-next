import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GetUsersUseCase } from '@/core/usecases/GetUsersUseCase';
import { CreateUserUseCase } from '@/core/usecases/CreateUserUseCase';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

// Schema de validación para query params
const getUsersSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  role: z.enum(['super_admin', 'admin', 'vendedor', 'contador']).optional()
});

// Schema de validación para crear usuario
const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['super_admin', 'admin', 'vendedor', 'contador'], {
    errorMap: () => ({ message: 'Rol inválido. Debe ser: super_admin, admin, vendedor o contador' })
  })
});

export async function GET(request: NextRequest) {
  try {
    // Validar autenticación
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    // Parsear query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit, role } = getUsersSchema.parse(queryParams);

    // Ejecutar use case
    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const userRepo = factory.getUserRepository();
    
    const getUsersUseCase = new GetUsersUseCase(userRepo);
    
    const result = await getUsersUseCase.execute({
      pagination: { page, limit },
      role: role as any
    });

    if (!result.success) {
      return createErrorResponse(result.error || 'Error al obtener usuarios', 500);
    }

    return createSuccessResponse(result.users);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Parámetros inválidos', 400, error.errors);
    }

    console.error('[API Users GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Validar autenticación
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    // Parsear y validar request body
    const body = await request.json();
    const { email, password, role } = createUserSchema.parse(body);

    // Ejecutar use case
    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const userRepo = factory.getUserRepository();
    
    const createUserUseCase = new CreateUserUseCase(userRepo);
    
    const result = await createUserUseCase.execute({
      email,
      password,
      role
    });

    if (!result.success) {
      return createErrorResponse(result.error || 'Error al crear usuario', 400);
    }

    return createSuccessResponse({
      user: result.user,
      message: 'Usuario creado exitosamente'
    }, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Users POST Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}