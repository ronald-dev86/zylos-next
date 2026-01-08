import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/supabase-client/client'
import { SupplierService } from '@/core/use-cases/SupplierService'
import { LedgerEntryRepository } from '@/infrastructure/database/LedgerEntryRepository'
import { SupplierRepository } from '@/infrastructure/database/SupplierRepository'
import { 
  ApiResponse, 
  CreateSupplier,
  UpdateSupplier,
  SupplierQuery
} from '@/shared/types/schemas'
import { PaginationParams } from '@/shared/types/common'

// Instanciar servicios
const supplierService = new SupplierService(
  new SupplierRepository(),
  new LedgerEntryRepository()
)

/**
 * Validar tenant ID desde headers del middleware
 */
function getTenantId(request: NextRequest): string | null {
  return request.headers.get('x-tenant-id')
}

/**
 * GET /api/suppliers - Obtener proveedores con paginación y filtros
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({
        success: false,
        message: 'Tenant not found',
        error: 'TENANT_REQUIRED'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    const query: SupplierQuery = {
      search: searchParams.get('search') || undefined,
      has_debt: searchParams.get('has_debt') === 'true',
      balance_min: searchParams.get('balance_min') ? Number(searchParams.get('balance_min')) : undefined,
      balance_max: searchParams.get('balance_max') ? Number(searchParams.get('balance_max')) : undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
    }

    const pagination: PaginationParams = {
      page: query.page,
      limit: query.limit
    }

    const result = await supplierService.getSuppliersWithBalance(tenantId, {
      ...query,
      ...pagination
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Suppliers GET error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve suppliers',
      error: 'SUPPLIERS_GET_ERROR'
    }, { status: 500 })
  }
}

/**
 * POST /api/suppliers - Crear nuevo proveedor con validación
 */
export async function POST(request: NextRequest) {
  try {
    const tenantId = getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({
        success: false,
        message: 'Tenant not found',
        error: 'TENANT_REQUIRED'
      }, { status: 401 })
    }

    const body = await request.json()
    
    const result = await supplierService.createSupplier(tenantId, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Suppliers POST error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to create supplier',
      error: 'SUPPLIERS_POST_ERROR'
    }, { status: 500 })
  }
}

/**
 * GET /api/suppliers/[id] - Obtener proveedor específico
 */
export async function GET_SUPPLIER(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenantId = getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({
        success: false,
        message: 'Tenant not found',
        error: 'TENANT_REQUIRED'
      }, { status: 401 })
    }

    const result = await supplierService.getSupplierById(id, tenantId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Supplier GET by ID error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve supplier',
      error: 'SUPPLIER_GET_ID_ERROR'
    }, { status: 500 })
  }
}

/**
 * PUT /api/suppliers/[id] - Actualizar proveedor existente
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenantId = getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({
        success: false,
        message: 'Tenant not found',
        error: 'TENANT_REQUIRED'
      }, { status: 401 })
    }

    const body = await request.json()
    
    const result = await supplierService.updateSupplier(id, tenantId, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Supplier PUT error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to update supplier',
      error: 'SUPPLIER_PUT_ERROR'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/suppliers/[id] - Eliminar proveedor con validaciones
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenantId = getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({
        success: false,
        message: 'Tenant not found',
        error: 'TENANT_REQUIRED'
      }, { status: 401 })
    }

    const result = await supplierService.deleteSupplier(id, tenantId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Supplier DELETE error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to delete supplier',
      error: 'SUPPLIER_DELETE_ERROR'
    }, { status: 500 })
  }
}

/**
 * POST /api/suppliers/[id]/payments - Procesar pagos a proveedores
 */
export async function POST_PAYMENT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenantId = getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({
        success: false,
        message: 'Tenant not found',
        error: 'TENANT_REQUIRED'
      }, { status: 401 })
    }

    const body = await request.json()
    
    const result = await supplierService.processSupplierPayment(id, tenantId, body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Supplier payment POST error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to process payment',
      error: 'SUPPLIER_PAYMENT_ERROR'
    }, { status: 500 })
  }
}

/**
 * GET /api/suppliers/[id]/transactions - Obtener transacciones del proveedor
 */
export async function GET_TRANSACTIONS(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const tenantId = getTenantId(request)
    
    if (!tenantId) {
      return NextResponse.json({
        success: false,
        message: 'Tenant not found',
        error: 'TENANT_REQUIRED'
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    const pagination: PaginationParams = {
      page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 20
    }

    const result = await supplierService.getSupplierTransactions(id, tenantId, pagination)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Supplier transactions GET error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to retrieve supplier transactions',
      error: 'SUPPLIER_TRANSACTIONS_ERROR'
    }, { status: 500 })
  }
}