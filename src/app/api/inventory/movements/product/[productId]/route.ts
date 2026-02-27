import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const productMovementsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});

export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit } = productMovementsSchema.parse(queryParams);

    const productId = params.productId;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const inventoryRepo = factory.getInventoryMovementRepository();

    const result = await inventoryRepo.findByProductId(productId, { page, limit });

    return createSuccessResponse(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Parámetros inválidos', 400, error.errors);
    }

    console.error('[API Inventory movements product/[productId] GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
