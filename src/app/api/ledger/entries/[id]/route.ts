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

    const entryId = params.id;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const ledgerRepo = factory.getLedgerEntryRepository();

    const entry = await ledgerRepo.findById(entryId);

    if (!entry) {
      return createErrorResponse('Asiento contable no encontrado', 404);
    }

    return createSuccessResponse({ entry });

  } catch (error) {
    console.error('[API Ledger entries [id] GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
