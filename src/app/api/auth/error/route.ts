import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de captura para errores de autenticación
 * Centraliza el manejo de errores y monitoreo
 */
export async function POST(request: NextRequest) {
  try {
    const { error, context, timestamp, requestId } = await request.json();
    
    console.error(`[Auth Error] ${context}:`, error);
    
    return NextResponse.json({
      success: false,
      error,
      context,
      timestamp: timestamp || new Date().toISOString(),
      requestId: requestId || 'unknown',
      apiVersion: '2.0.0',
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent')
    }, { status: 500 });
    
  } catch (parseError) {
    console.error('[Auth Error] Parse error:', parseError);
    
    return NextResponse.json({
      success: false,
      error: 'Error al procesar reporte de error',
      timestamp: new Date().toISOString(),
      apiVersion: '2.0.0'
    }, { status: 400 });
  }
}

/**
 * OPTIONS para el manejo de errores
 */
export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/auth/error',
    method: 'POST',
    description: 'Centralizar reportes de errores de autenticación',
    usage: {
      body: {
        error: 'string (required) - Descripción del error',
        context: 'string (required) - Contexto donde ocurrió el error',
        timestamp: 'string (optional) - Timestamp del error',
        requestId: 'string (optional) - ID único para correlación'
      }
    },
    examples: [
      {
        error: 'Invalid credentials',
        context: '/api/auth/login',
        timestamp: '2026-01-21T19:45:00Z',
        requestId: 'req_123456'
      }
    ]
  });
}