import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface TenantDetectionResult {
  isTenant: boolean;
  subdomain?: string;
  isProduction: boolean;
  domain?: string;
}

interface AuthValidationResult {
  isValid: boolean;
  user?: any;
  tenant?: any;
  error?: string;
  requiresRedirect: boolean;
  redirectUrl?: string;
}

function detectTenantSubdomain(hostname: string): TenantDetectionResult {
  // Load configuration from environment
  const tenantDomains = process.env.NEXT_PUBLIC_TENANT_DOMAINS?.split(',').map(d => d.trim()) || ['zylos.com'];
  const systemSubdomains = process.env.NEXT_PUBLIC_SYSTEM_SUBDOMAINS?.split(',').map(s => s.trim()) || ['www', 'api', 'mail', 'app', 'blog', 'docs', 'admin'];
  const devDetectionEnabled = process.env.NEXT_PUBLIC_DEV_TENANT_DETECTION === 'true';
  
  // Development detection
  if (hostname.includes('localhost')) {
    if (!devDetectionEnabled) {
      return { isTenant: false, isProduction: false };
    }
    
    const parts = hostname.split('.');
    const potentialSubdomain = parts[0];
    
    // If first part is 'localhost' → not a subdomain
    if (potentialSubdomain === 'localhost') {
      return { isTenant: false, isProduction: false };
    }
    
    // If first part is a system subdomain → not a tenant
    if (systemSubdomains.includes(potentialSubdomain)) {
      return { isTenant: false, isProduction: false };
    }
    
    // For any other subdomain in localhost → it's a tenant
    return { 
      isTenant: true, 
      subdomain: potentialSubdomain,
      isProduction: false 
    };
  }
  
  // Production detection for each configured domain
  for (const domain of tenantDomains) {
    if (hostname.includes(`.${domain}`)) {
      const parts = hostname.split('.');
      
      // Only subdomains with 3 parts: subdomain.domain.tld
      if (parts.length === 3) {
        const subdomain = parts[0];
        
        // Exclude system subdomains
        if (systemSubdomains.includes(subdomain)) {
          return { isTenant: false, isProduction: true, domain };
        }
        
        return { 
          isTenant: true, 
          subdomain: subdomain,
          isProduction: true,
          domain
        };
      }
      
      // Root domain or www → not a tenant
      return { isTenant: false, isProduction: true, domain };
    }
  }
  
  // Other custom domains (future use)
  return { isTenant: false, isProduction: false };
}

function validateAuthState(request: NextRequest, tenantInfo: TenantDetectionResult): AuthValidationResult {
  const authCookie = request.cookies.get('zylos_auth');
  const url = request.nextUrl;
  
  // No cookie
  if (!authCookie) {
    return {
      isValid: false,
      error: 'No auth cookie',
      requiresRedirect: url.pathname !== '/',
      redirectUrl: url.pathname === '/' ? null : '/'
    };
  }
  
  // Parse cookie
  try {
    const authData = JSON.parse(atob(authCookie.value));
    
    // Validate structure
    if (!authData?.user || !authData?.tenant) {
      return {
        isValid: false,
        error: 'Invalid auth structure',
        requiresRedirect: true,
        redirectUrl: '/'
      };
    }
    
    // Validate tenant match
    if (tenantInfo.isTenant && authData.tenant.subdomain !== tenantInfo.subdomain) {
      return {
        isValid: false,
        error: 'Tenant mismatch',
        requiresRedirect: true,
        redirectUrl: '/'
      };
    }
    
    // Validate token expiry
    if (authData.expiresAt && new Date(authData.expiresAt) < new Date()) {
      return {
        isValid: false,
        error: 'Token expired',
        requiresRedirect: true,
        redirectUrl: '/'
      };
    }
    
    return {
      isValid: true,
      user: authData.user,
      tenant: authData.tenant,
      requiresRedirect: false
    };
    
  } catch (error) {
    return {
      isValid: false,
      error: 'Cookie parse error',
      requiresRedirect: true,
      redirectUrl: '/'
    };
  }
}

function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard') || 
         pathname.startsWith('/admin') || 
         pathname.startsWith('/settings');
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  const tenantInfo = detectTenantSubdomain(hostname);
  
  // Non-tenant domains → redirect to platform
  if (!tenantInfo.isTenant && tenantInfo.isProduction && url.pathname === '/') {
    const platformUrl = process.env.NEXT_PUBLIC_PLATFORM_URL || 'https://zylos.com';
    return NextResponse.redirect(platformUrl);
  }
  
  // Validate auth state
  const authResult = validateAuthState(request, tenantInfo);
  
  // Handle redirect requirements
  if (authResult.requiresRedirect && authResult.redirectUrl) {
    return NextResponse.redirect(new URL(authResult.redirectUrl, request.url));
  }
  
  // Redirect authenticated users from root to dashboard
  if (authResult.isValid && url.pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Prevent access to protected routes for unauthenticated users
  if (!authResult.isValid && isProtectedRoute(url.pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}