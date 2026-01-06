import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/supabase-client/client'

interface Tenant {
  id: string
  name: string
  subdomain: string
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  
  const subdomain = getSubdomain(hostname)
  
  if (!subdomain) {
    return NextResponse.rewrite(new URL('/landing', request.url))
  }

  const supabase = createClient()
  
  try {
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, name, subdomain')
      .eq('subdomain', subdomain)
      .single() as { data: Tenant | null, error: Error | null }

    if (error || !tenant) {
      return NextResponse.rewrite(new URL('/not-found', request.url))
    }

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tenant-id', tenant.id)
    requestHeaders.set('x-tenant-name', tenant.name)
    requestHeaders.set('x-tenant-subdomain', tenant.subdomain)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.rewrite(new URL('/error', request.url))
  }
}

function getSubdomain(hostname: string): string | null {
  const domain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000'
  
  if (hostname === domain) {
    return null
  }

  const parts = hostname.split('.')
  if (parts.length >= 2 && parts[parts.length - 2] + '.' + parts[parts.length - 1] === domain) {
    return parts[0] || null
  }

  if (hostname.includes('localhost') && parts.length > 1) {
    return parts[0] || null
  }

  return null
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|landing|not-found|error).*)',
  ],
}