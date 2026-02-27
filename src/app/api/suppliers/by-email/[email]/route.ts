import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

export async function GET(request: NextRequest, { params }: { params: { email: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const email = decodeURIComponent(params.email);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const supplierRepo = factory.getSupplierRepository();

    const supplier = await supplierRepo.findByEmail(email);

    if (!supplier) {
      return createErrorResponse('Proveedor no encontrado', 404, { email });
    }

    return createSuccessResponse({ supplier });

  } catch (error) {
    console.error('[API Suppliers by-email GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
