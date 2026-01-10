import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAuthenticatedClient } from '@/lib/supabase';

const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().optional(),
  sku: z.string().min(1).max(50),
  price: z.number().positive(),
  initial_stock: z.number().min(0).default(0),
});

// GET - List products for current tenant
export async function GET(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient(request)
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Use RPC function to get products with stock
    const { data, error } = await supabase
      .rpc('get_tenant_products')

    if (error) {
      console.error('Products RPC error:', error);
      
      if (error.message?.includes('row-level security')) {
        return NextResponse.json(
          { success: false, error: 'Access denied - insufficient permissions' },
          { status: 403 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    const products = data?.products || []
    
    // Simple pagination (in production, do this in the database)
    const startIndex = (page - 1) * limit;
    const paginatedProducts = products.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total: products.length,
          totalPages: Math.ceil(products.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Products GET error:', error);
    
    if (error instanceof Error && error.message.includes('Tenant not found')) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const supabase = createAuthenticatedClient(request)
    const body = await request.json();
    const productData = productSchema.parse(body);

    // Use RPC function for product creation with stock
    const { data, error } = await supabase
      .rpc('create_product_rpc', {
        p_name: productData.name,
        p_description: productData.description,
        p_sku: productData.sku,
        p_price: productData.price,
        p_initial_stock: productData.initial_stock
      })

    if (error) {
      console.error('Product creation RPC error:', error);
      
      if (error.message?.includes('row-level security')) {
        return NextResponse.json(
          { success: false, error: 'Access denied - insufficient permissions' },
          { status: 403 }
        )
      }
      
      if (error.message?.includes('duplicate key')) {
        return NextResponse.json(
          { success: false, error: 'Product SKU already exists' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to create product' },
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
        { success: false, error: 'Invalid product data', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message.includes('Tenant not found')) {
      return NextResponse.json(
        { success: false, error: 'Tenant not found' },
        { status: 404 }
      )
    }

    console.error('Product POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}