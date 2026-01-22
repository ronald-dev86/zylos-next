import { NextRequest } from 'next/server';
import { User } from '@/core/entities/User';
import { Tenant } from '@/core/entities/Tenant';

/**
 * Resultado de validación de cookie de autenticación
 */
export interface AuthValidationResult {
  isValid: boolean;
  user?: User;
  tenant?: Tenant;
  token?: string;
  error?: string;
}

/**
 * Valida la cookie de autenticación y extrae sus datos
 * Implementa validaciones de seguridad y expiración
 */
export function validateAuthCookie(request: NextRequest): AuthValidationResult {
  const authCookie = request.cookies.get('zylos_auth');
  
  if (!authCookie) {
    return { isValid: false, error: 'No auth cookie' };
  }
  
  try {
    const authData = JSON.parse(atob(authCookie.value));
    
    // Validar estructura básica
    if (!authData?.user || !authData?.tenant || !authData?.token) {
      return { isValid: false, error: 'Invalid auth structure' };
    }
    
    // Validar expiración del token
    if (authData.expiresAt && new Date(authData.expiresAt) < new Date()) {
      return { isValid: false, error: 'Token expired' };
    }
    
    // Validar que tenant tenga subdominio
    if (!authData.tenant?.subdomain) {
      return { isValid: false, error: 'Invalid tenant data' };
    }
    
    // Validar que user tenga ID y email
    if (!authData.user?.id || !authData.user?.email) {
      return { isValid: false, error: 'Invalid user data' };
    }
    
    return {
      isValid: true,
      user: authData.user,
      tenant: authData.tenant,
      token: authData.token
    };
    
  } catch (error) {
    console.error('[AuthValidation] Cookie parse error:', error);
    return { isValid: false, error: 'Cookie parse error' };
  }
}

/**
 * Extrae el subdominio del hostname
 * Usado para validación cross-domain
 */
export function extractSubdomain(hostname: string): string | null {
  if (!hostname) return null;
  
  const parts = hostname.split('.');
  
  // Ignorar www y localhost
  if (parts.length < 2 || parts[0] === 'www' || parts[0] === 'localhost') {
    return null;
  }
  
  return parts[0];
}

/**
 * Establece cookie de autenticación con configuración segura
 */
export function setAuthCookie(
  response: NextResponse, 
  token: string, 
  user: User, 
  tenant: Tenant
): NextResponse {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 días
  
  response.cookies.set('zylos_auth', JSON.stringify({
    token,
    user,
    tenant,
    expiresAt: expiresAt.toISOString()
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
    path: '/'
  });
  
  return response;
}

/**
 * Elimina cookie de autenticación
 */
export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set('zylos_auth', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    path: '/'
  });
  
  return response;
}