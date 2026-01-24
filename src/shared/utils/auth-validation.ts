import { NextRequest } from 'next/server';
import { User } from '@/core/entities/User';
import { Tenant } from '@/core/entities/Tenant';

interface AuthValidationResult {
  isValid: boolean;
  user?: User;
  tenant?: Tenant;
  token?: string;
  error?: string;
}

export function validateAuthCookie(request: NextRequest): AuthValidationResult {
  const authCookie = request.cookies.get('zylos_auth');
  
  if (!authCookie) {
    return { isValid: false, error: 'No auth cookie' };
  }
  
  try {
    const authData = JSON.parse(authCookie.value);
    
    if (!authData?.user || !authData?.tenant || !authData?.token) {
      return { isValid: false, error: 'Invalid auth structure' };
    }
    
    // Validar expiración
    if (authData.expiresAt && new Date(authData.expiresAt) < new Date()) {
      return { isValid: false, error: 'Token expired' };
    }
    
    return {
      isValid: true,
      user: authData.user,
      tenant: authData.tenant,
      token: authData.token
    };
    
  } catch (error) {
    return { isValid: false, error: 'Cookie parse error' };
  }
}

export function extractSubdomain(hostname: string): string | null {
  const parts = hostname.split('.');
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0];
  }
  return null;
}