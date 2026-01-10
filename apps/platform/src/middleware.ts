import { NextResponse, NextRequest } from 'next/server'

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
  
  // Only respond to platform subdomain
  if (subdomain !== 'platform') {
    return NextResponse.redirect(new URL('https://platform.zylos.com', req.url))
  }

  // Platform app handles its own routing
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