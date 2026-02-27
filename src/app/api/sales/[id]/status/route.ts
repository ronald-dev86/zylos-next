import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'completed', 'cancelled'])
});

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

    const saleId = params.id;
    const body = await request.json();
    const { status } = updateStatusSchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const saleRepo = factory.getSaleRepository();

    const existingSale = await saleRepo.findById(saleId);
    if (!existingSale) {
      return createErrorResponse('Venta no encontrada', 404);
    }

    const updatedSale = await saleRepo.updateStatus(saleId, status);

    return createSuccessResponse({
      sale: updatedSale,
      message: 'Status de venta actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Sales [id]/status PUT Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
