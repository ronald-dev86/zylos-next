import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route principal de autenticación
 * Proporciona información sobre todos los endpoints disponibles
 * GET /api/auth
 */
export async function GET() {
  return NextResponse.json({
    service: 'Zylos ERP Authentication API',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    description: 'Sistema de autenticación multi-tenant para Zylos ERP',
    endpoints: {
      authentication: {
        group: 'Autenticación',
        methods: ['POST', 'GET'],
        endpoints: [
          {
            path: '/api/auth/login',
            method: 'POST',
            description: 'Iniciar sesión de usuario',
            tags: ['auth', 'login', 'authentication']
          },
          {
            path: '/api/auth/me',
            method: 'GET',
            description: 'Obtener información del usuario autenticado',
            tags: ['auth', 'me', 'user-info']
          },
          {
            path: '/api/auth/logout',
            method: 'POST',
            description: 'Cerrar sesión del usuario',
            tags: ['auth', 'logout', 'signout']
          },
          {
            path: '/api/auth/refresh',
            method: 'POST',
            description: 'Refrescar token de acceso',
            tags: ['auth', 'refresh', 'token']
          },
          {
            path: '/api/auth/health',
            method: 'GET',
            description: 'Verificar estado del sistema',
            tags: ['health', 'status', 'monitoring']
          }
        ]
      },
      examples: {
        login: {
          description: 'Ejemplo de login exitoso',
          request: {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              email: 'user@example.com',
              password: 'password123',
              subdomain: 'mitienda'
            }
          },
          response: {
            success: true,
            user: {
              id: 'uuid-123',
              email: 'user@example.com',
              role: 'admin'
            },
            tenant: {
              id: 'tenant-456',
              name: 'Mi Tienda',
              subdomain: 'mitienda'
            },
            redirectUrl: '/dashboard'
          }
        },
        me: {
          description: 'Ejemplo de obtención de información de usuario',
          request: {
            method: 'GET',
            headers: {
              'Cookie': 'zylos_auth=...'
            }
          },
          response: {
            success: true,
            user: {
              id: 'uuid-123',
              email: 'user@example.com',
              role: 'admin'
            },
            permissions: {
              canManageUsers: true,
              canManageProducts: true
            }
          }
        },
        logout: {
          description: 'Ejemplo de cierre de sesión',
          request: {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          },
          response: {
            success: true,
            message: 'Sesión cerrada'
          }
        }
      }
    },
    configuration: {
      security: {
        authentication: {
          method: 'Cookie-based (httpOnly)',
          cookieName: 'zylos_auth',
          duration: '7 days',
          secure: 'production only',
          sameSite: 'lax'
        },
        tenantIsolation: {
          method: 'Multi-tenant with RLS',
          subdomainBased: true,
          databaseIsolation: true,
          crossDomainPrevention: true
        },
        encryption: {
          type: 'HTTPS',
          transport: 'RSA-2048',
          restApiSecurity: true
        }
      },
      deployment: {
        environment: process.env.NODE_ENV || 'development',
        domains: {
          production: 'zylos.com',
          development: 'localhost:3000'
        }
      }
    },
    documentation: {
      swagger: '/api/docs',
      postman: '/docs/postman',
      developerGuide: '/docs/guide'
    },
    status: {
      api: 'operational',
      database: 'configured',
      authentication: 'ready',
      monitoring: 'available'
    }
  });
}