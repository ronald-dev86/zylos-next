import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const saleSchema = z.object({
  items: z.array(z.object({
    product_id: z.number(),
    quantity: z.number().positive(),
    price: z.number().positive()
  })),
  customer_id: z.number().optional(),
  total: z.number().positive(),
  subtotal: z.number().positive(),
  tax: z.number().positive(),
  payment_method: z.enum(['cash', 'card', 'transfer']),
});

// GET - List sales for the current tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // TODO: Implement actual database query with Supabase
    // Mock sales data
    const mockSales = [
      {
        id: 1,
        sale_number: "SALE-001",
        total: 109.97,
        subtotal: 94.80,
        tax: 15.17,
        items: [
          { product_id: 1, quantity: 2, price: 29.99 },
          { product_id: 2, quantity: 1, price: 49.99 }
        ],
        customer_id: null,
        payment_method: 'cash',
        status: 'completed',
        tenant_id: 'tenant_123',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        sale_number: "SALE-002",
        total: 59.98,
        subtotal: 51.71,
        tax: 8.27,
        items: [
          { product_id: 3, quantity: 2, price: 15.99 }
        ],
        customer_id: 1,
        payment_method: 'card',
        status: 'completed',
        tenant_id: 'tenant_123',
        created_at: new Date(Date.now() - 3600000).toISOString()
      }
    ];

    // Simulate date filtering
    let filteredSales = mockSales;
    
    if (startDate || endDate) {
      filteredSales = filteredSales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        const start = startDate ? new Date(startDate) : new Date('1970-01-01');
        const end = endDate ? new Date(endDate) : new Date();
        return saleDate >= start && saleDate <= end;
      });
    }

    // Simulate pagination
    const startIndex = (page - 1) * limit;
    const paginatedSales = filteredSales.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: {
        sales: paginatedSales,
        pagination: {
          page,
          limit,
          total: filteredSales.length,
          totalPages: Math.ceil(filteredSales.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Sales GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales' },
      { status: 500 }
    );
  }
}

// POST - Create new sale
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const saleData = saleSchema.parse(body);

    // TODO: Implement actual sale creation with Supabase
    // This should be a database function (RPC) to ensure atomicity
    
    // Mock sale creation
    const newSale = {
      id: Date.now(),
      sale_number: "SALE-" + Date.now(),
      ...saleData,
      status: 'completed',
      tenant_id: 'tenant_123', // This should come from JWT token
      created_at: new Date().toISOString()
    };

    // Mock inventory movements
    const inventoryMovements = saleData.items.map(item => ({
      id: Date.now() + item.product_id,
      product_id: item.product_id,
      quantity: -item.quantity, // Negative for outgoing inventory
      type: 'sale',
      reference_id: newSale.id,
      tenant_id: 'tenant_123',
      created_at: new Date().toISOString()
    }));

    console.log('Created sale:', newSale);
    console.log('Inventory movements:', inventoryMovements);

    return NextResponse.json({
      success: true,
      data: {
        sale: newSale,
        inventory_movements: inventoryMovements
      }
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid sale data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Sale POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create sale' },
      { status: 500 }
    );
  }
}