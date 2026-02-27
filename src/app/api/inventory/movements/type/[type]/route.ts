import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const typeSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});

export async function GET(request: NextRequest, { params }: { params: { type: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit } = typeSchema.parse(queryParams);

    const movementType = params.type as 'sale' | 'purchase' | 'adjustment';

    if (!['sale', 'purchase', 'adjustment'].includes(movementType)) {
      return createErrorResponse('Tipo de movimiento inválido', 400, {
        validTypes: ['sale', 'purchase', 'adjustment']
      });
    }

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const inventoryRepo = factory.getInventoryMovementRepository();

    const result = await inventoryRepo.findByReferenceType(movementType, { page, limit });

    return createSuccessResponse(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Parámetros inválidos', 400, error.errors);
    }

    console.error('[API Inventory movements type/[type] GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
