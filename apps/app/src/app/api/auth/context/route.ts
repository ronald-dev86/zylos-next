import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient } from '@/lib/supabase'

// GET - Get current tenant info and user context
export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient(request)
    
    // Get current user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get tenant info from headers (set by middleware)
    const tenantId = request.headers.get('x-tenant-id')
    const tenantName = request.headers.get('x-tenant-name')
    const tenantSubdomain = request.headers.get('x-tenant-subdomain')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    // Get user role from user metadata
    const userRole = user.user_metadata?.role || user.user_metadata?.app_metadata?.role || 'vendedor'

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email,
          role: userRole,
        },
        tenant: {
          id: tenantId,
          name: tenantName || '',
          subdomain: tenantSubdomain || '',
        },
        permissions: {
          isAdmin: ['admin', 'super_admin'].includes(userRole),
          canManageUsers: ['admin', 'super_admin'].includes(userRole),
          canManageProducts: true, // All authenticated users can manage products
          canManageCustomers: true,
          canManageSales: true,
          canViewReports: ['admin', 'contador', 'super_admin'].includes(userRole),
        }
      }
    });

  } catch (error) {
    console.error('Auth context GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get auth context' },
      { status: 500 }
    );
  }
}

// POST - Refresh tenant context (useful after tenant switching)
export async function POST(request: NextRequest) {
  try {
    const supabase = createClientForComponent()
    
    // Get current user to ensure they're authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get tenant info from headers (set by middleware)
    const tenantId = request.headers.get('x-tenant-id')
    const tenantName = request.headers.get('x-tenant-name')
    const tenantSubdomain = request.headers.get('x-tenant-subdomain')

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        tenant: {
          id: tenantId,
          name: tenantName || '',
          subdomain: tenantSubdomain || '',
        },
        user: {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'vendedor',
        },
        refreshed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Auth context POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to refresh context' },
      { status: 500 }
    );
  }
}