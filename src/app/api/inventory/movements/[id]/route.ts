import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const movementId = params.id;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const inventoryRepo = factory.getInventoryMovementRepository();

    const movement = await inventoryRepo.findById(movementId);

    if (!movement) {
      return createErrorResponse('Movimiento de inventario no encontrado', 404);
    }

    return createSuccessResponse({ movement });

  } catch (error) {
    console.error('[API Inventory movements [id] GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
