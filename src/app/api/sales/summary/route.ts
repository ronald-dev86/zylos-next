import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const summarySchema = z.object({
  startDate: z.string().datetime('Fecha de inicio inválida').optional(),
  endDate: z.string().datetime('Fecha de fin inválida').optional()
});

export async function GET(request: NextRequest) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { startDate, endDate } = summarySchema.parse(queryParams);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const saleRepo = factory.getSaleRepository();

    const defaultStartDate = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
    const defaultEndDate = endDate ? new Date(endDate) : new Date();

    const summary = await saleRepo.getSalesSummary(defaultStartDate, defaultEndDate);

    return createSuccessResponse({
      summary: {
        ...summary,
        startDate: defaultStartDate.toISOString(),
        endDate: defaultEndDate.toISOString()
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Parámetros inválidos', 400, error.errors);
    }

    console.error('[API Sales summary GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
