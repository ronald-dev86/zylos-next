import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const updateCustomerSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const customerId = params.id;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const customerRepo = factory.getCustomerRepository();

    const customer = await customerRepo.findById(customerId);

    if (!customer) {
      return createErrorResponse('Cliente no encontrado', 404);
    }

    return createSuccessResponse({ customer });

  } catch (error) {
    console.error('[API Customers [id] GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userRole = authResult.user?.role;
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return createErrorResponse('Permisos insuficientes', 403);
    }

    const customerId = params.id;
    const body = await request.json();
    const updateData = updateCustomerSchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const customerRepo = factory.getCustomerRepository();

    const existingCustomer = await customerRepo.findById(customerId);
    if (!existingCustomer) {
      return createErrorResponse('Cliente no encontrado', 404);
    }

    if (updateData.email && updateData.email !== existingCustomer.email) {
      const emailCustomer = await customerRepo.findByEmail(updateData.email);
      if (emailCustomer && emailCustomer.id !== customerId) {
        return createErrorResponse('El email ya está en uso por otro cliente', 409);
      }
    }

    const updatedCustomer = await customerRepo.update(customerId, updateData);

    return createSuccessResponse({
      customer: updatedCustomer,
      message: 'Cliente actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Customers [id] PUT Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userRole = authResult.user?.role;
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return createErrorResponse('Permisos insuficientes', 403);
    }

    const customerId = params.id;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const customerRepo = factory.getCustomerRepository();

    const existingCustomer = await customerRepo.findById(customerId);
    if (!existingCustomer) {
      return createErrorResponse('Cliente no encontrado', 404);
    }

    await customerRepo.delete(customerId);

    return createSuccessResponse({
      message: 'Cliente eliminado exitosamente'
    });

  } catch (error) {
    console.error('[API Customers [id] DELETE Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
