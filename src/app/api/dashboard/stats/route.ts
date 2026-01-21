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

    // Set tenant context for RLS
    await supabase.rpc('set_tenant_context', { 
      p_tenant_id: userWithTenant.tenantId 
    });

    // Get dashboard stats
    const stats = await getDashboardStats(userWithTenant.tenantId);

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getDashboardStats(tenantId: string) {
  const supabase = createServerClient();
  
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Get total sales (sum of sale_amount from sales table)
    const { data: salesData } = await supabase
      .from('sales')
      .select('sale_amount')
      .eq('tenant_id', tenantId);

    const totalSales = salesData?.reduce((sum, sale) => sum + (sale.sale_amount || 0), 0) || 0;

    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Get total customers
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    return {
      totalUsers: totalUsers || 0,
      totalSales,
      totalProducts: totalProducts || 0,
      totalCustomers: totalCustomers || 0
    };

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    
    // Return default values if tables don't exist yet
    return {
      totalUsers: 0,
      totalSales: 0,
      totalProducts: 0,
      totalCustomers: 0
    };
  }
}