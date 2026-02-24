import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const lowStockSchema = z.object({
  threshold: z.string().optional().transform(val => val ? parseInt(val) : 10)
});

export async function GET(request: NextRequest) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { threshold } = lowStockSchema.parse(queryParams);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const productRepo = factory.getProductRepository();

    const products = await productRepo.getLowStockProducts(threshold);

    return createSuccessResponse({
      products,
      count: products.length,
      threshold
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Parámetros inválidos', 400, error.errors);
    }

    console.error('[API Products low-stock GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
