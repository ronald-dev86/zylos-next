import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CreateTenantAndUserUseCase } from '@/core/usecases/CreateTenantAndUserUseCase';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const signupSchema = z.object({
  storeName: z.string().min(2, 'El nombre de la tienda debe tener al menos 2 caracteres'),
  subdomain: z.string()
    .min(3, 'El subdominio debe tener al menos 3 caracteres')
    .regex(/^[a-z0-9]+$/, 'El subdominio solo puede contener letras minúsculas y números'),
  ownerName: z.string().min(2, 'El nombre del proprietario debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener mayúsculas, minúsculas y números'),
});

export async function POST(request: NextRequest) {
  try {
    // Parsear y validar request
    const body = await request.json();
    const { storeName, subdomain, ownerName, email, password } = signupSchema.parse(body);

    // Ejecutar use case de creación
    const factory = RepositoryFactory.getInstance('*'); // No tenant context para creación
    const tenantRepo = factory.getTenantRepository();
    const userRepo = factory.getUserRepository('*'); // Temporal, sin tenant hasta que se cree
    
    const createTenantUserUseCase = new CreateTenantAndUserUseCase(tenantRepo, userRepo);
    
    const result = await createTenantUserUseCase.execute({
      storeName,
      subdomain,
      ownerName,
      email,
      password
    });

    if (!result.success) {
      return createErrorResponse(result.error || 'Error al crear tienda', 400);
    }

    // Establecer cookie httpOnly
    const response = createSuccessResponse({
      success: true,
      tenant: result.tenant,
      user: result.user,
      redirectUrl: `https://${result.tenant?.subdomain}.zylos.com/dashboard`
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

    console.error('[API Signup Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/auth/signup',
    method: 'POST',
    description: 'Crear nueva tienda (tenant) y usuario administrador',
    usage: {
      body: {
        storeName: 'string (required) - Nombre de la tienda',
        subdomain: 'string (required) - Subdominio único',
        ownerName: 'string (required) - Nombre del proprietario',
        email: 'string (required) - Email del administrador',
        password: 'string (required) - Contraseña segura'
      }
    },
    examples: [
      {
        storeName: 'Mi Tienda',
        subdomain: 'mitienda',
        ownerName: 'Juan Pérez',
        email: 'juan@mitienda.com',
        password: 'MiPassword123'
      }
    ]
  });
}