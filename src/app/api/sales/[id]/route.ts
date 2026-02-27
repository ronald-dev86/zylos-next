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

    const saleId = params.id;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const saleRepo = factory.getSaleRepository();

    const sale = await saleRepo.findById(saleId);

    if (!sale) {
      return createErrorResponse('Venta no encontrada', 404);
    }

    return createSuccessResponse({ sale });

  } catch (error) {
    console.error('[API Sales [id] GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
