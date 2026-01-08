import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Extraer subdominio del hostname
 */
function extractSubdomain(hostname: string): string | null {
  if (!hostname) return null
  
  // Normalizar hostname (eliminar puerto si existe)
  const cleanHost = hostname.split(':')[0]
  
  // Caso 1: localhost con subdominio (demo.localhost:3000 -> demo)
  if (cleanHost && cleanHost.includes('localhost')) {
    const parts = cleanHost.split('.')
    return parts.length > 1 ? (parts[0] || null) : null
  }
  
  // Caso 2: IP con puerto (192.168.1.1:3000) - no tiene subdominio
  if (cleanHost && /^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) {
    return null
  }
  
  // Caso 3: Dominio completo (example.com) - no tiene subdominio
  const parts = cleanHost?.split('.')
  if (!parts || parts.length < 2) return null
  
  // Caso 4: Dominio con subdominio (demo.example.com -> demo)
  if (parts && parts.length >= 2) {
    // Si es www, lo consideramos como no tener subdominio
    if (parts[0]?.toLowerCase() === 'www') {
      return null
    }
    // Extraer primer segmento como subdominio
    const subdomain = parts[0]
    
    // Validar que el subdominio sea válido
    if (subdomain && isValidSubdomain(subdomain)) {
      return subdomain
    }
  }
  
  return null
}

/**
 * Valida que el subdominio cumpla con las reglas de negocio
 */
function isValidSubdomain(subdomain: string): boolean {
  if (!subdomain || subdomain.length === 0) return false
  if (subdomain.length > 63) return false // Límite RFC
  
  // No permitir caracteres inválidos
  const invalidChars = /[<>:"/\\|?*\s]/
  if (invalidChars.test(subdomain)) return false
  
  // No permitir subdominios reservados
  const reservedSubdomains = [
    'api', 'admin', 'www', 'mail', 'ftp', 'cdn', 
    'staging', 'dev', 'test', 'demo', 'app', 'blog',
    'shop', 'store', 'support', 'help', 'docs'
  ]
  
  if (reservedSubdomains.includes(subdomain.toLowerCase())) {
    return false
  }
  
  // Solo permite letras, números y guiones
  const validPattern = /^[a-z0-9-]+$/
  if (!validPattern.test(subdomain)) return false
  
  // No puede empezar o terminar con guión
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) return false
  
  return true
}

import { createServerClient } from '@/lib/supabase/server'

/**
 * Middleware para autenticación y gestión de tenants
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Skip middleware for static files and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/static')
  ) {
    return response
  }

  const supabase = await createServerClient()

  // Refresh session if expired - required for Server Components
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Handle authentication routes
  if (request.nextUrl.pathname.startsWith('/auth')) {
    // Redirect authenticated users away from auth pages
    if (session) {
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }

  // Handle protected routes
  const protectedRoutes = ['/dashboard', '/pos', '/accounting', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Extract tenant from subdomain
  const hostname = request.headers.get('host') || ''
  const subdomain = extractSubdomain(hostname)

  // Skip tenant validation for main domain and localhost
  if (
    hostname === 'localhost:3000' ||
    hostname === 'zylos.com' ||
    subdomain === 'www' ||
    subdomain === 'api'
  ) {
    return response
  }

  // Validate tenant exists and is active
  if (session && subdomain) {
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, active')
      .eq('subdomain', subdomain)
      .eq('active', true)
      .single()

    if (!tenant) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('error', 'invalid_tenant')
      return NextResponse.redirect(redirectUrl)
    }

    // Verify user belongs to this tenant
    const { data: userTenant } = await supabase
      .from('users')
      .select('id, tenant_id, role')
      .eq('id', session.user.id)
      .eq('tenant_id', (tenant as any)?.id)
      .single()

    if (!userTenant) {
      await supabase.auth.signOut()
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('error', 'tenant_access_denied')
      return NextResponse.redirect(redirectUrl)
    }

    // Add tenant context to headers for downstream components
    response.headers.set('x-tenant-id', (tenant as any)?.id)
    response.headers.set('x-tenant-subdomain', subdomain)
    response.headers.set('x-user-role', (userTenant as any)?.role)
  }

  // Always add tenant identification headers
  if (subdomain) {
    response.headers.set('x-subdomain', subdomain)
    response.headers.set('x-tenant', subdomain)
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}