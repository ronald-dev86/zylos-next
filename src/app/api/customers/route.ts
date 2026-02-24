import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const getCustomersSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});

const createCustomerSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit } = getCustomersSchema.parse(queryParams);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const customerRepo = factory.getCustomerRepository();

    const result = await customerRepo.findByTenantId({ page, limit });

    return createSuccessResponse(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Parámetros inválidos', 400, error.errors);
    }

    console.error('[API Customers GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userRole = authResult.user?.role;
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return createErrorResponse('Permisos insuficientes', 403, {
        requiredRole: 'admin o super_admin',
        currentRole: userRole
      });
    }

    const body = await request.json();
    const customerData = createCustomerSchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const customerRepo = factory.getCustomerRepository();

    if (customerData.email) {
      const existingCustomer = await customerRepo.findByEmail(customerData.email);
      if (existingCustomer) {
        return createErrorResponse('El email ya está en uso', 409, { email: customerData.email });
      }
    }

    const newCustomer = await customerRepo.create({
      name: customerData.name,
      email: customerData.email || undefined,
      phone: customerData.phone,
      address: customerData.address
    });

    return createSuccessResponse({
      customer: newCustomer,
      message: 'Cliente creado exitosamente'
    }, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Customers POST Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/customers',
    methods: {
      GET: 'Listar clientes con paginación',
      POST: 'Crear nuevo cliente'
    },
    description: 'CRUD de clientes - Listar y crear',
    authentication: 'Required (httpOnly cookie)',
    authorization: 'POST requiere admin o super_admin'
  });
}
