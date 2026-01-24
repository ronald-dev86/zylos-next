import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse } from '@/shared/utils/api-response';

export async function POST(request: NextRequest) {
  const response = createSuccessResponse({
    message: 'Sesión cerrada exitosamente'
  });
  
  // Eliminar cookie
  response.cookies.set('zylos_auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/'
  });
  
  return response;
}