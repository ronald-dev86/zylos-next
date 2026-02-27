import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const updatePaymentSchema = z.object({
  paymentStatus: z.enum(['pending', 'paid', 'refunded'])
});

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userRole = authResult.user?.role;
    if (!['admin', 'super_admin', 'cashier'].includes(userRole || '')) {
      return createErrorResponse('Permisos insuficientes', 403);
    }

    const saleId = params.id;
    const body = await request.json();
    const { paymentStatus } = updatePaymentSchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const saleRepo = factory.getSaleRepository();

    const existingSale = await saleRepo.findById(saleId);
    if (!existingSale) {
      return createErrorResponse('Venta no encontrada', 404);
    }

    const updatedSale = await saleRepo.updatePaymentStatus(saleId, paymentStatus);

    return createSuccessResponse({
      sale: updatedSale,
      message: 'Estado de pago actualizado exitosamente'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Sales [id]/payment PUT Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
