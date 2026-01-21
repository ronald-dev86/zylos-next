import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get subdomain from request headers or host
    const host = request.headers.get('host') || ''
    const subdomain = host.split('.')[0] || ''

    // TODO: Validate subdomain exists and is active
    // For now, just return subdomain info
    
    return NextResponse.json({
      subdomain,
      host,
      message: 'Subdomain context working'
    })
  } catch (error) {
    console.error('Subdomain context error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}