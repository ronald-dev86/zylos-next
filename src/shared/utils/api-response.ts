import { NextResponse } from 'next/server';

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