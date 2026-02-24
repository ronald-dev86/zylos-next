import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const categorySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});

export async function GET(request: NextRequest, { params }: { params: { category: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const category = decodeURIComponent(params.category);
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit } = categorySchema.parse(queryParams);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const productRepo = factory.getProductRepository();

    const result = await productRepo.findByCategory(category, { page, limit });

    return createSuccessResponse(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Parámetros inválidos', 400, error.errors);
    }

    console.error('[API Products category GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
