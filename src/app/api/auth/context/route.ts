import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';
import { extractSubdomain } from '@/shared/utils/auth-validation';

export async function GET(request: NextRequest) {
  try {
    // Get subdomain from request headers or host
    const host = request.headers.get('host') || '';
    const subdomain = extractSubdomain(host) || '';

    if (!subdomain) {
      return createErrorResponse('No se pudo detectar el subdominio del tenant', 400);
    }

    // Validar que el tenant exista y esté activo
    const factory = RepositoryFactory.getInstance('*');
    const tenantRepo = factory.getTenantRepository();
    
    const tenant = await tenantRepo.findBySubdomain(subdomain);
    
    if (!tenant) {
      return createErrorResponse('Tenant no encontrado', 404, { 
        subdomain,
        host,
        message: 'El subdominio proporcionado no corresponde a un tenant válido'
      });
    }

    if (!tenant.isActive) {
      return createErrorResponse('Tenant inactivo', 403, {
        subdomain,
        tenantId: tenant.id,
        message: 'Este tenant está temporalmente desactivado'
      });
    }

    // Retornar información del contexto del tenant
    return createSuccessResponse({
      subdomain,
      host,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        active: tenant.isActive,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt
      },
      context: {
        isValid: true,
        isDevelopment: host.includes('localhost'),
        isProduction: host.includes('.zylos.com'),
        environment: process.env.NODE_ENV || 'development'
      },
      message: 'Tenant context valid and active'
    });

  } catch (error) {
    console.error('[API Context Error]', error);
    return createErrorResponse('Error interno del servidor', 500, {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/auth/context',
    method: 'GET',
    description: 'Obtener información del contexto del tenant actual',
    usage: {
      headers: {
        host: 'string (automatic) - Host de la solicitud para detectar subdominio'
      }
    },
    responses: {
      200: {
        description: 'Tenant válido y activo',
        body: {
          subdomain: 'string',
          host: 'string',
          tenant: {
            id: 'string',
            name: 'string',
            subdomain: 'string',
            active: 'boolean',
            createdAt: 'string',
            updatedAt: 'string'
          },
          context: {
            isValid: 'boolean',
            isDevelopment: 'boolean',
            isProduction: 'boolean',
            environment: 'string'
          }
        }
      },
      400: {
        description: 'No se pudo detectar subdominio'
      },
      404: {
        description: 'Tenant no encontrado'
      },
      403: {
        description: 'Tenant inactivo'
      }
    },
    examples: [
      {
        request: {
          method: 'GET',
          url: 'https://mitienda.localhost:3000/api/auth/context'
        },
        response: {
          subdomain: 'mitienda',
          host: 'mitienda.localhost:3000',
          tenant: {
            id: 'uuid-123',
            name: 'Mi Tienda',
            subdomain: 'mitienda',
            active: true,
            createdAt: '2026-01-21T00:00:00Z',
            updatedAt: '2026-01-21T00:00:00Z'
          },
          context: {
            isValid: true,
            isDevelopment: true,
            isProduction: false,
            environment: 'development'
          }
        }
      }
    ]
  });
}