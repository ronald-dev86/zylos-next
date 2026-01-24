import { NextRequest, NextResponse } from 'next/server';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    const authResult = validateAuthCookie(request);
    
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }
    
    return createSuccessResponse({
      user: authResult.user,
      tenant: authResult.tenant,
      isAuthenticated: true
    });
    
  } catch (error) {
    console.error('[API Me Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}