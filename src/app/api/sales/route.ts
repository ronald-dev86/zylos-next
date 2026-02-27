import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const saleItemSchema = z.object({
  productId: z.string().uuid('ID de producto inválido'),
  quantity: z.number().int().positive('La cantidad debe ser mayor a 0'),
  unitPrice: z.number().nonnegative('El precio debe ser positivo')
});

const createSaleSchema = z.object({
  customerId: z.string().uuid('ID de cliente inválido'),
  items: z.array(saleItemSchema).min(1, 'Debe incluir al menos un producto'),
  tax: z.number().nonnegative().optional()
});

export async function POST(request: NextRequest) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const userRole = authResult.user?.role;
    if (!['admin', 'super_admin', 'cashier'].includes(userRole || '')) {
      return createErrorResponse('Permisos insuficientes', 403, {
        requiredRole: 'admin, super_admin o cashier',
        currentRole: userRole
      });
    }

    const body = await request.json();
    const saleData = createSaleSchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const saleRepo = factory.getSaleRepository();

    const newSale = await saleRepo.create({
      customerId: saleData.customerId,
      items: saleData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      tax: saleData.tax
    });

    return createSuccessResponse({
      sale: newSale,
      message: 'Venta creada exitosamente'
    }, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Sales POST Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/sales',
    methods: {
      POST: 'Crear nueva venta'
    },
    description: 'Crear venta - Requiere rol admin, super_admin o cashier',
    authentication: 'Required (httpOnly cookie)',
    authorization: 'admin, super_admin, cashier'
  });
}
