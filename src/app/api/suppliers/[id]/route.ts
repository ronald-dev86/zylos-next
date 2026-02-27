import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const updateSupplierSchema = z.object({
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

    const supplierId = params.id;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const supplierRepo = factory.getSupplierRepository();

    const supplier = await supplierRepo.findById(supplierId);

    if (!supplier) {
      return createErrorResponse('Proveedor no encontrado', 404);
    }

    return createSuccessResponse({ supplier });

  } catch (error) {
    console.error('[API Suppliers [id] GET Error]', error);
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

    const supplierId = params.id;
    const body = await request.json();
    const updateData = updateSupplierSchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const supplierRepo = factory.getSupplierRepository();

    const existingSupplier = await supplierRepo.findById(supplierId);
    if (!existingSupplier) {
      return createErrorResponse('Proveedor no encontrado', 404);
    }

    if (updateData.email && updateData.email !== existingSupplier.email) {
      const emailSupplier = await supplierRepo.findByEmail(updateData.email);
      if (emailSupplier && emailSupplier.id !== supplierId) {
        return createErrorResponse('El email ya está en uso por otro proveedor', 409);
      }
    }

    const updatedSupplier = await supplierRepo.update(supplierId, updateData);

    return createSuccessResponse({
      supplier: updatedSupplier,
      message: 'Proveedor actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Suppliers [id] PUT Error]', error);
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

    const supplierId = params.id;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const supplierRepo = factory.getSupplierRepository();

    const existingSupplier = await supplierRepo.findById(supplierId);
    if (!existingSupplier) {
      return createErrorResponse('Proveedor no encontrado', 404);
    }

    await supplierRepo.delete(supplierId);

    return createSuccessResponse({
      message: 'Proveedor eliminado exitosamente'
    });

  } catch (error) {
    console.error('[API Suppliers [id] DELETE Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
