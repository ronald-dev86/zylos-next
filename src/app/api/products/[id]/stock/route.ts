import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const updateStockSchema = z.object({
  quantity: z.number().int().min(0, 'El stock no puede ser negativo')
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userRole = authResult.user?.role;
    if (!['admin', 'super_admin', 'vendedor'].includes(userRole || '')) {
      return createErrorResponse('Permisos insuficientes', 403);
    }

    const productId = params.id;
    const body = await request.json();
    const { quantity } = updateStockSchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const productRepo = factory.getProductRepository();

    const existingProduct = await productRepo.findById(productId);
    if (!existingProduct) {
      return createErrorResponse('Producto no encontrado', 404);
    }

    const updatedProduct = await productRepo.updateStock(productId, quantity);

    return createSuccessResponse({
      product: updatedProduct,
      message: 'Stock actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Products stock PUT Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
