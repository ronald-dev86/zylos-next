import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const headers = {
    'x-tenant-id': request.headers.get('x-tenant-id'),
    'x-tenant-name': request.headers.get('x-tenant-name'),
    'x-tenant-subdomain': request.headers.get('x-tenant-subdomain'),
    'host': request.headers.get('host'),
    'user-agent': request.headers.get('user-agent'),
  }

  return NextResponse.json(headers)
}