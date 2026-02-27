import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const createEntrySchema = z.object({
  entityType: z.string().min(1, 'El tipo de entidad es requerido'),
  entityId: z.string().uuid('ID de entidad inválido'),
  type: z.enum(['debit', 'credit']),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  description: z.string().min(1, 'La descripción es requerida'),
  referenceId: z.string().uuid().optional()
});

export async function POST(request: NextRequest) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userRole = authResult.user?.role;
    if (!['admin', 'super_admin'].includes(userRole || '')) {
      return createErrorResponse('Permisos insuficientes', 403, {
        requiredRole: 'admin o super_admin',
        currentRole: userRole
      });
    }

    const body = await request.json();
    const entryData = createEntrySchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const ledgerRepo = factory.getLedgerEntryRepository();

    const newEntry = await ledgerRepo.create({
      entityType: entryData.entityType,
      entityId: entryData.entityId,
      type: entryData.type,
      amount: entryData.amount,
      description: entryData.description,
      referenceId: entryData.referenceId
    });

    return createSuccessResponse({
      entry: newEntry,
      message: 'Asiento contable creado exitosamente'
    }, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Ledger entries POST Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/ledger/entries',
    methods: {
      POST: 'Crear asiento contable'
    },
    description: 'Crear asiento - Requiere rol admin o super_admin',
    authentication: 'Required (httpOnly cookie)',
    authorization: 'admin, super_admin'
  });
}
