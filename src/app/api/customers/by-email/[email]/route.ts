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
    const customerRepo = factory.getCustomerRepository();

    const customer = await customerRepo.findByEmail(email);

    if (!customer) {
      return createErrorResponse('Cliente no encontrado', 404, { email });
    }

    return createSuccessResponse({ customer });

  } catch (error) {
    console.error('[API Customers by-email GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
