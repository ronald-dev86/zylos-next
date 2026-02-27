import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const createMovementSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  type: z.enum(['in', 'out']),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  reason: z.string().optional(),
  referenceType: z.enum(['sale', 'purchase', 'adjustment']).optional(),
  referenceId: z.string().uuid().optional(),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userRole = authResult.user?.role;
    if (!['admin', 'super_admin', 'inventory_manager'].includes(userRole || '')) {
      return createErrorResponse('Permisos insuficientes', 403, {
        requiredRole: 'admin, super_admin o inventory_manager',
        currentRole: userRole
      });
    }

    const body = await request.json();
    const movementData = createMovementSchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const inventoryRepo = factory.getInventoryMovementRepository();

    const newMovement = await inventoryRepo.create({
      productId: movementData.productId,
      type: movementData.type,
      quantity: movementData.quantity,
      reason: movementData.reason,
      referenceType: movementData.referenceType,
      referenceId: movementData.referenceId,
      notes: movementData.notes
    });

    return createSuccessResponse({
      movement: newMovement,
      message: 'Movimiento de inventario creado exitosamente'
    }, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Inventory movements POST Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/inventory/movements',
    methods: {
      POST: 'Crear movimiento de inventario'
    },
    description: 'Crear movimiento - Requiere rol admin, super_admin o inventory_manager',
    authentication: 'Required (httpOnly cookie)',
    authorization: 'admin, super_admin, inventory_manager'
  });
}
