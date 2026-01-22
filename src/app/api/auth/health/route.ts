import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para health check del sistema de autenticación
 * GET /api/auth/health
 * 
 * Verifica el estado del sistema y los servicios de autenticación
 */
export async function GET(request: NextRequest) {
  const timestamp = new Date().toISOString();
  const hostname = request.headers.get('host') || '';
  
  try {
    // Verificar si es un tenant válido
    const isTenant = hostname.includes('.zylos.com') && !hostname.includes('www.') ||
                        hostname.includes('.localhost:3000') && hostname.split('.')[0] !== 'localhost';
    
    // Verificar variables de entorno críticas
    const criticalEnvVars = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL
    };
    
    const allVarsPresent = Object.values(criticalEnvVars).every(Boolean);
    
    // Simular conexión a Supabase (verificar sin credenciales)
    let supabaseHealth = true;
    try {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        throw new Error('Variables de entorno no configuradas');
      }
      // Solo validamos las variables, no hacemos conexión real
    } catch (error) {
      supabaseHealth = false;
    }
    
    const healthStatus = {
      status: allVarsPresent && supabaseHealth ? 'healthy' : 'unhealthy',
      timestamp,
      hostname,
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0',
      services: {
        authentication: {
          status: allVarsPresent ? 'operational' : 'misconfigured',
          methods: ['POST /api/auth/login', 'GET /api/auth/me', 'POST /api/auth/logout', 'POST /api/auth/refresh'],
          endpoints: {
            login: '/api/auth/login',
            me: '/api/auth/me',
            logout: '/api/auth/logout',
            refresh: '/api/auth/refresh',
            health: '/api/auth/health'
          }
        },
        database: {
          status: supabaseHealth ? 'connected' : 'disconnected',
          type: 'Supabase',
          configured: criticalEnvVars.SUPABASE_URL && criticalEnvVars.SUPABASE_SERVICE_KEY
        },
        security: {
          cookiesEnabled: true,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        }
      },
      issues: []
    };
    
    // Agregar issues si los hay
    if (!allVarsPresent) {
      healthStatus.issues.push('Variables de entorno críticas no configuradas');
    }
    
    if (!supabaseHealth) {
      healthStatus.issues.push('Configuración de Supabase incorrecta');
    }
    
    if (!isTenant && !hostname.includes('localhost:3000')) {
      healthStatus.issues.push('No es un tenant válido o desarrollo local');
    }
    
    // Determinar código de estado general
    let statusCode = 200;
    if (healthStatus.status !== 'healthy') {
      statusCode = 503; // Service Unavailable
    }
    
    return NextResponse.json(healthStatus, { status: statusCode });
    
  } catch (error) {
    console.error('[Auth Health] Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp,
      error: error instanceof Error ? error.message : 'Health check failed',
      services: {
        authentication: { status: 'failed' },
        database: { status: 'failed' }
      }
    }, { status: 503 });
  }
}