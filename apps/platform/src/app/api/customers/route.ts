import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedClient } from '@/lib/supabase';

const customerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(50).optional(),
  address: z.string().max(500).optional(),
});

// GET - List customers for current tenant
export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient(request)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Use RPC function to get customers with balance
    const { data, error } = await supabase
      .rpc('get_tenant_customers')

    if (error) {
      console.error('Customers RPC error:', error);
      
      if (error.message?.includes('row-level security')) {
        return NextResponse.json(
          { success: false, error: 'Access denied - insufficient permissions' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch customers' },
        { status: 500 }
      )
    }

    const customers = data?.customers || []
    
    // Simple pagination (in production, do this in the database)
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = customers.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      data: {
        customers: paginatedCustomers,
        pagination: {
          page,
          limit,
          total: customers.length,
          totalPages: Math.ceil(customers.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Customers GET error:', error);
    
    if (error instanceof Error && error.message.includes('Tenant not found')) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient(request)
    const body = await request.json();
    const customerData = customerSchema.parse(body);

    // Use RPC function for customer creation
    const { data, error } = await supabase
      .rpc('create_customer_rpc', {
        p_name: customerData.name,
        p_email: customerData.email,
        p_phone: customerData.phone,
        p_address: customerData.address
      })

    if (error) {
      console.error('Customer creation RPC error:', error);
      
      if (error.message?.includes('row-level security')) {
        return NextResponse.json(
          { success: false, error: 'Access denied - insufficient permissions' },
          { status: 403 }
        )
      }
      
      if (error.message?.includes('duplicate key')) {
        return NextResponse.json(
          { success: false, error: 'Customer email already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create customer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid customer data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Tenant not found')) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    console.error('Customer POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}