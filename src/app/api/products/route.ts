import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string().optional(),
  sku: z.string().optional(),
  stock: z.number().min(0).default(0),
  description: z.string().optional(),
});

const updateProductSchema = productSchema.partial();

// GET - List products for the current tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // TODO: Implement actual database query with Supabase
    // Mock data for demonstration
    const mockProducts = [
      {
        id: 1,
        name: "Producto A",
        price: 29.99,
        category: "Electrónica",
        sku: "PROD-001",
        stock: 45,
        tenant_id: "tenant_123",
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: "Producto B",
        price: 49.99,
        category: "Ropa",
        sku: "PROD-002",
        stock: 12,
        tenant_id: "tenant_123",
        created_at: new Date().toISOString()
      }
    ];

    // Simulate filtering
    let filteredProducts = mockProducts;
    
    if (category && category !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.category === category);
    }
    
    if (search) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Simulate pagination
    const startIndex = (page - 1) * limit;
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: {
        products: paginatedProducts,
        pagination: {
          page,
          limit,
          total: filteredProducts.length,
          totalPages: Math.ceil(filteredProducts.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productData = productSchema.parse(body);

    // TODO: Implement actual product creation with Supabase
    // Mock product creation
    const newProduct = {
      id: Date.now(),
      ...productData,
      tenant_id: 'tenant_123', // This should come from JWT token
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Created product:', newProduct);

    return NextResponse.json({
      success: true,
      data: newProduct
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid product data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Product POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = updateProductSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual product update with Supabase
    // Mock product update
    const updatedProduct = {
      id,
      ...updateData,
      tenant_id: 'tenant_123', // This should come from JWT token
      updated_at: new Date().toISOString()
    };

    console.log('Updated product:', updatedProduct);

    return NextResponse.json({
      success: true,
      data: updatedProduct
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid update data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Product PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual product deletion with Supabase
    // Mock deletion
    console.log('Deleted product:', id);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}