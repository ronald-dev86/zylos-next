import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const entitySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20)
});

export async function GET(request: NextRequest, { params }: { params: { entityType: string; entityId: string } }) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit } = entitySchema.parse(queryParams);

    const entityType = params.entityType;
    const entityId = params.entityId;

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const ledgerRepo = factory.getLedgerEntryRepository();

    const entriesByType = await ledgerRepo.findByEntityType(entityType, { page: 1, limit: 1000 });
    
    const filteredEntries = entriesByType.data.filter(entry => entry.entityId === entityId);

    return createSuccessResponse({
      data: filteredEntries,
      pagination: {
        page,
        limit,
        total: filteredEntries.length,
        totalPages: Math.ceil(filteredEntries.length / limit)
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Parámetros inválidos', 400, error.errors);
    }

    console.error('[API Ledger entries entity/[entityType]/[entityId] GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}
