import { NextResponse } from 'next/server';

/**
 * Utilidades para respuestas API estándar
 * Proporciona respuestas consistentes con formato unificado
 */

export function createSuccessResponse(data: any, status: number = 200): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status });
}

export function createErrorResponse(
  message: string, 
  status: number = 400, 
  details?: any
): NextResponse {
  return NextResponse.json({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  }, { status });
}

export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  },
  status: number = 200
): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    pagination,
    timestamp: new Date().toISOString()
  }, { status });
}