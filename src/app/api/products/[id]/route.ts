import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().positive().optional(),
  cost: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).optional(),
  category: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: 'Debe proporcionar al menos un campo para actualizar'
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const productId = params.id;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const productRepo = factory.getProductRepository();

    const product = await productRepo.findById(productId);

    if (!product) {
      return createErrorResponse('Producto no encontrado', 404);
    }

    return createSuccessResponse({ product });

  } catch (error) {
    console.error('[API Products [id] GET Error]', error);
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

    const productId = params.id;
    const body = await request.json();
    const updateData = updateProductSchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const productRepo = factory.getProductRepository();

    const existingProduct = await productRepo.findById(productId);
    if (!existingProduct) {
      return createErrorResponse('Producto no encontrado', 404);
    }

    if (updateData.sku && updateData.sku !== existingProduct.sku) {
      const skuProduct = await productRepo.findBySku(updateData.sku);
      if (skuProduct && skuProduct.id !== productId) {
        return createErrorResponse('El SKU ya está en uso por otro producto', 409);
      }
    }

    const updatedProduct = await productRepo.update(productId, updateData);

    return createSuccessResponse({
      product: updatedProduct,
      message: 'Producto actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Products [id] PUT Error]', error);
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

    const productId = params.id;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const productRepo = factory.getProductRepository();

    const existingProduct = await productRepo.findById(productId);
    if (!existingProduct) {
      return createErrorResponse('Producto no encontrado', 404);
    }

    await productRepo.delete(productId);

    return createSuccessResponse({
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('[API Products [id] DELETE Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
