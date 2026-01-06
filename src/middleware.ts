import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/supabase-client/client'

interface Tenant {
  id: string
  name: string
  subdomain: string
}

interface TenantCache {
  tenant: Tenant | null
  timestamp: number
}

// Cache simple en memoria para tenant lookup (5 minutos)
const tenantCache = new Map<string, TenantCache>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  const subdomain = extractSubdomain(hostname)
  
  // Si no hay subdominio, ir a landing
  if (!subdomain) {
    return NextResponse.rewrite(new URL('/landing', request.url))
  }

  // Verificar cache primero
  const cached = tenantCache.get(subdomain)
  const now = Date.now()
  
  let tenant: Tenant | null = null
  let fromCache = false
  
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    tenant = cached.tenant
    fromCache = true
    console.log(`🏷️ Tenant cache hit for: ${subdomain}`)
  } else {
    tenant = await fetchTenantFromDB(subdomain)
    if (tenant) {
      tenantCache.set(subdomain, {
        tenant,
        timestamp: now
      })
      console.log(`🏷️ Tenant fetched from DB: ${subdomain}`)
    }
  }

  // Si no se encuentra el tenant, 404
  if (!tenant) {
    console.log(`❌ Tenant not found: ${subdomain}`)
    return NextResponse.rewrite(new URL('/not-found', request.url))
  }

  // Inyectar headers de tenant en el request
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-id', tenant.id)
  requestHeaders.set('x-tenant-name', tenant.name)
  requestHeaders.set('x-tenant-subdomain', tenant.subdomain)
  requestHeaders.set('x-tenant-cached', fromCache.toString())

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

/**
 * Extrae subdominio de forma completamente dinámica sin valores hardcodeados
 * Soporta múltiples formatos: localhost, dominios personalizados, subdominios anidados
 */
function extractSubdomain(hostname: string): string | null {
  if (!hostname) return null
  
  // Normalizar hostname (eliminar puerto si existe)
  const cleanHost = hostname.split(':')[0]
  
  // Caso 1: localhost con subdominio (demo.localhost:3000 -> demo)
  if (cleanHost.includes('localhost')) {
    const parts = cleanHost.split('.')
    return parts.length > 1 ? parts[0] : null
  }
  
  // Caso 2: IP con puerto (192.168.1.1:3000) - no tiene subdominio
  if (/^\d+\.\d+\.\d+\.\d+$/.test(cleanHost)) {
    return null
  }
  
  // Caso 3: Dominio completo (example.com) - no tiene subdominio
  const parts = cleanHost.split('.')
  if (parts.length < 2) return null
  
  // Caso 4: Dominio con subdominio (demo.example.com -> demo)
  if (parts.length >= 2) {
    // Si es www, lo consideramos como no tener subdominio
    if (parts[0].toLowerCase() === 'www') {
      return null
    }
    
    // Extraer primer segmento como subdominio
    const subdomain = parts[0]
    
    // Validar que el subdominio sea válido
    if (isValidSubdomain(subdomain)) {
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
    'api', 'admin', 'www', 'mail', 'ftp', 'cdn', 'static', 'assets',
    'blog', 'shop', 'store', 'app', 'dashboard', 'panel', 'console'
  ]
  
  if (reservedSubdomains.includes(subdomain.toLowerCase())) {
    return false
  }
  
  return true
}

/**
 * Obtiene tenant desde base de datos con manejo de errores robusto
 */
async function fetchTenantFromDB(subdomain: string): Promise<Tenant | null> {
  try {
    const supabase = createClient()
    
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, subdomain')
      .eq('subdomain', subdomain)
      .eq('active', true) // Solo tenants activos
      .single() as { data: Tenant | null, error: Error | null }

    if (error) {
      console.error(`❌ DB Error for tenant ${subdomain}:`, error)
      return null
    }

    return tenant
  } catch (error) {
    console.error(`❌ Exception fetching tenant ${subdomain}:`, error)
    return null
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|landing|not-found|error).*)',
  ],
}