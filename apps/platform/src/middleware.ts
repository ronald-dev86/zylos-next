import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const hostname = req.headers.get('host')
  const path = url.pathname

  // Extraer subdominio
  if(path === '/landing' || path.startsWith('/api/auth/') || path == ('/auth/signup')) {
    return NextResponse.next()
  }
  
  
    
    try {
      // Crear cliente con service role para lookup de tenant
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
      const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      
      // Buscar tenant por subdominio
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, active, name, subdomain')
        .eq('subdomain', subdomain.toLowerCase())
        .eq('active', true)
        .single()
      
        
      if (error || !tenant) {
        console.error(`Tenant not found or inactive for subdomain: ${tenant}, ${subdomain}`)
        console.error('Tenant lookup failed:', error)
        return NextResponse.redirect(new URL('/landing', url.origin))
      }
      
      // Setear headers de tenant para API routes
      res.headers.set('x-tenant-id', tenant.id)
      res.headers.set('x-tenant-name', tenant.name)
      res.headers.set('x-tenant-subdomain', tenant.subdomain)
      
      console.log(`Tenant resolved: ${tenant.name} (${tenant.id}) for ${subdomain}`)
      
      return res
      
    } catch (error) {
      console.error('Middleware error:', error)
      return NextResponse.redirect(new URL('/landing', url.origin))
    }
  
  
  // Para raíz, dejar pasar sin headers de tenant
  return NextResponse.next()
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