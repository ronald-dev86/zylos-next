import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/infrastructure/supabase-client/client';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createServerClient();

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user with tenant info
    const userRepository = RepositoryFactory.getUserRepositoryStatic();
    const userWithTenant = await userRepository.findByEmail(user.email!);

    if (!userWithTenant) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user can view users
    if (!userWithTenant.canManageUsers()) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get all users for this tenant
    const tenantUsers = await userRepository.findByTenantId();

    return NextResponse.json({
      success: true,
      data: tenantUsers.map(user => ({
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}