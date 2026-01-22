import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthenticateUserUseCase } from '@/core/usecases/AuthenticateUserUseCase';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { 
  InvalidCredentialsError, 
  TenantNotFoundError 
} from '@/shared/errors/ApplicationError';
import { 
  createSuccessResponse, 
  createErrorResponse 
} from '@/shared/utils/api-response';
import { 
  extractSubdomain, 
  setAuthCookie 
} from '@/shared/utils/auth-validation';
import { loginSchema } from '@/shared/schemas/auth-schemas';

/**
 * API Route para autenticación de usuarios
 * POST /api/auth/login
 * 
 * Implementa autenticación segura con:
 * - Validación de inputs con Zod
 * - Detección de subdominio
 * - Use Case de negocio
 * - HttpOnly cookies
 * - Manejo de errores específicos
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Auth Login] Request received');
    
    // 1. Parsear y validar request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('[Auth Login] Validation failed:', validationResult.error.errors);
      return createErrorResponse(
        'Datos inválidos',
        400,
        validationResult.error.errors
      );
    }
    
    const { email, password, subdomain: providedSubdomain } = validationResult.data;
    console.log('[Auth Login] Parsed data:', { email, providedSubdomain });
    
    // 2. Detectar subdominio desde hostname o usar el proporcionado
    const hostname = request.headers.get('host') || '';
    const detectedSubdomain = extractSubdomain(hostname);
    const finalSubdomain = providedSubdomain || detectedSubdomain;
    
    console.log('[Auth Login] Tenant detection:', { hostname, detectedSubdomain, finalSubdomain });
    
    if (!finalSubdomain) {
      return createErrorResponse(
        'No se pudo detectar el subdominio. Proporción el subdominio o acceda desde tu URL personalizada.',
        400
      );
    }
    
    // 3. Crear repositorios y ejecutar use case
    const factory = RepositoryFactory.getInstance(finalSubdomain);
    const userRepo = factory.getUserRepository();
    const tenantRepo = factory.getTenantRepository();
    
    const authenticateUseCase = new AuthenticateUserUseCase(userRepo, tenantRepo);
    
    console.log('[Auth Login] Executing authentication for tenant:', finalSubdomain);
    
    const result = await authenticateUseCase.execute({
      email,
      password,
      subdomain: finalSubdomain
    });
    
    console.log('[Auth Login] Authentication result:', { 
      success: result.success, 
      error: result.error,
      hasUser: !!result.user,
      hasTenant: !!result.tenant
    });
    
    if (!result.success) {
      let statusCode = 401;
      
      // Determinar código de estado específico según el error
      if (result.error?.includes('no encontrado')) {
        statusCode = 404;
      } else if (result.error?.includes('desactivado')) {
        statusCode = 403;
      }
      
      return createErrorResponse(result.error || 'Autenticación fallida', statusCode);
    }
    
    // 4. Establecer cookie httpOnly y retornar éxito
    console.log('[Auth Login] Setting auth cookie for user:', result.user?.email);
    
    const response = createSuccessResponse({
      success: true,
      message: 'Autenticación exitosa',
      user: {
        id: result.user?.id,
        email: result.user?.email,
        role: result.user?.role,
        firstName: result.user?.firstName,
        lastName: result.user?.lastName
      },
      tenant: {
        id: result.tenant?.id,
        name: result.tenant?.name,
        subdomain: result.tenant?.subdomain,
        domain: result.tenant?.subdomain + '.zylos.com'
      },
      redirectUrl: '/dashboard'
    });
    
    // Establecer cookie con todos los datos necesarios
    const finalResponse = setAuthCookie(
      response,
      result.token!,
      result.user!,
      result.tenant!
    );
    
    console.log('[Auth Login] Response sent successfully');
    return finalResponse;
    
  } catch (error) {
    console.error('[Auth Login] Unexpected error:', error);
    
    // Manejo específico de errores de autenticación
    if (error instanceof InvalidCredentialsError) {
      return createErrorResponse('Credenciales inválidas', 401);
    }
    
    if (error instanceof TenantNotFoundError) {
      return createErrorResponse('Tenant no encontrado o inactivo', 404);
    }
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }
    
    return createErrorResponse('Error interno del servidor', 500);
  }
}

/**
 * Opciones para el método GET (para información del endpoint)
 */
export async function GET() {
  return createSuccessResponse({
    endpoint: '/api/auth/login',
    method: 'POST',
    description: 'Autenticación de usuarios del sistema Zylos ERP',
    usage: {
      email: 'string (required) - Email del usuario',
      password: 'string (required) - Contraseña del usuario',
      subdomain: 'string (optional) - Subdominio del tenant'
    },
    notes: [
      'Si no se proporciona subdominio, se detecta automáticamente desde el hostname',
      'La autenticación establece cookie httpOnly con 7 días de duración',
      'Response incluye user, tenant y redirectUrl'
    ]
  });
}