import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const hostname = req.headers.get('host')
  const path = url.pathname

  // Skip middleware for static files and API routes
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api') ||
    path.startsWith('/static') ||
    path.includes('.')
  ) {
    return NextResponse.next()
  }

  // Extract subdomain from hostname
  const subdomain = hostname?.split('.')[0]
  
  // For tenant subdomains, validate tenant exists
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('id, active, name, subdomain')
      .eq('subdomain', subdomain?.toLowerCase())
      .eq('active', true)
      .single()
    
    if (error || !tenant) {
      console.error(`Tenant not found: ${subdomain}`)
      return NextResponse.redirect(new URL('https://platform.zylos.com', req.url))
    }
    
    // Set tenant headers for app routes
    const response = NextResponse.next()
    response.headers.set('x-tenant-id', tenant.id)
    response.headers.set('x-tenant-name', tenant.name)
    response.headers.set('x-tenant-subdomain', tenant.subdomain)
    
    return response
    
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('https://platform.zylos.com', req.url))
  }
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