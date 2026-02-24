import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

export async function GET(request: NextRequest, { params }: { params: { sku: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const sku = params.sku;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const productRepo = factory.getProductRepository();

    const product = await productRepo.findBySku(sku);

    if (!product) {
      return createErrorResponse('Producto no encontrado', 404, { sku });
    }

    return createSuccessResponse({ product });

  } catch (error) {
    console.error('[API Products by-sku GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
