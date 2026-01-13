import { NextResponse, NextRequest } from 'next/server'

export async function proxy(req: NextRequest) {
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
  
  // Add tenant context to headers for downstream use
  const response = NextResponse.next()
  if (subdomain) {
    response.headers.set('x-tenant', subdomain)
  }
  
  return response
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