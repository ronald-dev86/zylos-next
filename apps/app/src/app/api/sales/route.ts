import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClientForRoute, createAuthenticatedClient } from '@/lib/supabase';
import { Database } from '@/shared/types/database';

const saleSchema = z.object({
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.number().positive(),
    unit_price: z.number().positive()
  })),
  customer_id: z.string().uuid().optional(),
  tax: z.number().min(0).default(0),
});

// GET - List sales for the current tenant
export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient(request)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Use RPC function to get sales with tenant isolation
    const { data, error } = await supabase
      .rpc('get_sales', {
        p_limit: limit,
        p_offset: (page - 1) * limit
      })

    if (error) {
      console.error('Sales RPC error:', error);
      
      // Handle RLS policy errors
      if (error.message?.includes('row-level security')) {
        return NextResponse.json(
          { success: false, error: 'Access denied - insufficient permissions' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sales' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || { sales: [] }
    });

  } catch (error) {
    console.error('Sales GET error:', error);
    
    if (error instanceof Error && error.message.includes('Tenant not found')) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

// POST - Create new sale
export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient(request)
    const body = await request.json();
    const saleData = saleSchema.parse(body);

    // Use RPC function for atomic sale creation
    const { data, error } = await supabase
      .rpc('create_sale_transaction_rpc', {
        p_customer_id: saleData.customer_id,
        p_items: saleData.items,
        p_tax: saleData.tax || 0
      })

    if (error) {
      console.error('Sale creation RPC error:', error);
      
      // Handle RLS policy errors
      if (error.message?.includes('row-level security')) {
        return NextResponse.json(
          { success: false, error: 'Access denied - insufficient permissions' },
          { status: 403 }
        )
      }
      
      // Handle insufficient stock
      if (error.message?.includes('Insufficient stock')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient stock for requested items' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create sale' },
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
        { success: false, error: 'Invalid sale data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Tenant not found')) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    console.error('Sale POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}