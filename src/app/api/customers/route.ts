import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  credit_limit: z.number().nonnegative().default(0),
});

const updateCustomerSchema = customerSchema.partial();

// GET - List customers for the current tenant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // TODO: Implement actual database query with Supabase
    // Mock customers data
    const mockCustomers = [
      {
        id: 1,
        name: "Cliente A",
        email: "cliente@example.com",
        phone: "+1234567890",
        address: "123 Main St, City",
        credit_limit: 1000.00,
        current_balance: 250.50,
        total_purchases: 3420.75,
        tenant_id: 'tenant_123',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        name: "Cliente B",
        email: null,
        phone: "+0987654321",
        address: "456 Oak Ave, Town",
        credit_limit: 500.00,
        current_balance: 0,
        total_purchases: 890.25,
        tenant_id: 'tenant_123',
        created_at: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    // Simulate search filtering
    let filteredCustomers = mockCustomers;
    
    if (search) {
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.name.toLowerCase().includes(search.toLowerCase()) ||
        customer.email?.toLowerCase().includes(search.toLowerCase()) ||
        customer.phone?.includes(search)
      );
    }

    // Simulate pagination
    const startIndex = (page - 1) * limit;
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: {
        customers: paginatedCustomers,
        pagination: {
          page,
          limit,
          total: filteredCustomers.length,
          totalPages: Math.ceil(filteredCustomers.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Customers GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const customerData = customerSchema.parse(body);

    // TODO: Implement actual customer creation with Supabase
    // Mock customer creation
    const newCustomer = {
      id: Date.now(),
      ...customerData,
      current_balance: 0,
      total_purchases: 0,
      tenant_id: 'tenant_123', // This should come from JWT token
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Created customer:', newCustomer);

    return NextResponse.json({
      success: true,
      data: newCustomer
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid customer data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Customer POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

// PUT - Update customer
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = updateCustomerSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual customer update with Supabase
    // Mock customer update
    const updatedCustomer = {
      id,
      ...updateData,
      tenant_id: 'tenant_123', // This should come from JWT token
      updated_at: new Date().toISOString()
    };

    console.log('Updated customer:', updatedCustomer);

    return NextResponse.json({
      success: true,
      data: updatedCustomer
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid update data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Customer PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual customer deletion with Supabase
    // Check if customer has outstanding balance or transactions
    // Mock deletion
    console.log('Deleted customer:', id);

    return NextResponse.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Customer DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}