import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RepositoryFactory } from '@/infrastructure/factories/RepositoryFactory';
import { validateAuthCookie } from '@/shared/utils/auth-validation';
import { createSuccessResponse, createErrorResponse } from '@/shared/utils/api-response';

const getProductsSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  category: z.string().optional()
});

const createProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().optional(),
  sku: z.string().optional(),
  price: z.number().positive('El precio debe ser positivo'),
  cost: z.number().positive().optional(),
  stockQuantity: z.number().int().min(0).optional().default(0),
  category: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const authResult = validateAuthCookie(request);
    if (!authResult.isValid) {
      return createErrorResponse('No autenticado', 401, authResult.error);
    }

    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const { page, limit, category } = getProductsSchema.parse(queryParams);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const productRepo = factory.getProductRepository();

    let result;
    if (category) {
      result = await productRepo.findByCategory(category, { page, limit });
    } else {
      result = await productRepo.findByTenantId({ page, limit });
    }

    return createSuccessResponse(result);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Parámetros inválidos', 400, error.errors);
    }

    console.error('[API Products GET Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

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
    const productData = createProductSchema.parse(body);

    const factory = RepositoryFactory.getInstance(authResult.tenant!.id);
    const productRepo = factory.getProductRepository();

    if (productData.sku) {
      const existingProduct = await productRepo.findBySku(productData.sku);
      if (existingProduct) {
        return createErrorResponse('El SKU ya está en uso', 409, { sku: productData.sku });
      }
    }

    const newProduct = await productRepo.create({
      name: productData.name,
      description: productData.description,
      sku: productData.sku,
      price: productData.price,
      cost: productData.cost,
      stockQuantity: productData.stockQuantity,
      category: productData.category
    });

    return createSuccessResponse({
      product: newProduct,
      message: 'Producto creado exitosamente'
    }, 201);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Datos inválidos', 400, error.errors);
    }

    console.error('[API Products POST Error]', error);
    return createErrorResponse('Error interno del servidor', 500);
  }
}

export async function OPTIONS() {
  return NextResponse.json({
    endpoint: '/api/products',
    methods: {
      GET: 'Listar productos con paginación opcional',
      POST: 'Crear nuevo producto'
    },
    description: 'CRUD de productos - Listar y crear',
    authentication: 'Required (httpOnly cookie)',
    authorization: 'POST requiere admin o super_admin'
  });
}
