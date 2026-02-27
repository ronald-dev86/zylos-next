import { NextRequest, NextResponse } from 'next/server';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

export async function GET(request: NextRequest, { params }: { params: { entityType: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const entityType = params.entityType;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const ledgerRepo = factory.getLedgerEntryRepository();

    const balance = await ledgerRepo.getBalanceByEntityType(entityType);

    return createSuccessResponse({
      entityType,
      balance,
      currency: 'USD'
    });

  } catch (error) {
    console.error('[API Ledger balance/[entityType] GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
