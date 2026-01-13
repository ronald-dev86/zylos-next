import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ subdomain: string }> }) {
  try {
    const { subdomain } = await params

    // TODO: Validate subdomain exists and is active
    // For now, just return the subdomain info
    
    return NextResponse.json({
      subdomain,
      message: 'Subdomain route working'
    })
  } catch (error) {
    console.error('Subdomain route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}