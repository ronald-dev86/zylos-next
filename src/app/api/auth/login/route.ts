import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthenticateUserUseCase } from '@/core/usecases/AuthenticateUserUseCase';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { createErrorResponse, createSuccessResponse } from '@/shared/utils/api-response';
import { extractSubdomain } from '@/shared/utils/auth-validation';

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
    
    console.error('[API Login Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}