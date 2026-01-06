import { createClient } from '@/infrastructure/supabase-client/client'
import { Database } from '@/shared/types/database'
import { 
  Supplier, 
  CreateSupplier, 
  UpdateSupplier,
  SupplierQuery,
  ApiResponse,
  PaginationMeta,
  CreateSupplierSchema,
  UpdateSupplierSchema,
  SupplierQuerySchema
} from '@/shared/types/schemas'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

/**
 * Repositorio de Proveedores con validación Zod y lógica de negocio
 */
export class SupplierRepository implements ISupplierRepository {
  private supabase = createClient()

  /**
   * Crear nuevo proveedor con validación completa
   */
  async create(supplierData: CreateSupplier): Promise<ApiResponse<Supplier>> {
    try {
      // Validar esquema con Zod
      const validatedData = CreateSupplierSchema.parse(supplierData)
      
      const { data, error } = await this.supabase
        .from('suppliers')
        .insert({
          tenant_id: validatedData.tenant_id,
          name: validatedData.name,
          email: validatedData.email || null,
          phone: validatedData.phone || null,
          address: validatedData.address || null
        })
        .select()
        .single()

      if (error) {
        console.error('Supplier creation error:', error)
        return {
          success: false,
          message: error.message || 'Failed to create supplier',
          error: 'SUPPLIER_CREATE_ERROR'
        }
      }

      return {
        success: true,
        message: 'Supplier created successfully',
        data: data as Supplier
      }
    } catch (error) {
      console.error('Supplier validation error:', error)
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Validation error',
          error: 'SUPPLIER_VALIDATION_ERROR',
          details: error instanceof Error ? error.message : null
        }
    }
  }

  /**
   * Obtener proveedor por ID con validación de tenant
   */
  async findById(id: string, tenantId: string): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Supplier find error:', error)
      return null
    }

    return data as Supplier || null
  }

  /**
   * Buscar proveedor por email (únicidad)
   */
  async findByEmail(email: string, tenantId: string): Promise<Supplier | null> {
    const { data, error } = await this.supabase
      .from('suppliers')
      .select('*')
      .eq('email', email)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Supplier email search error:', error)
      return null
    }

    return data as Supplier || null
  }

  /**
   * Obtener proveedores por tenant con paginación y filtros
   */
  async findByTenantId(
    tenantId: string, 
    query: SupplierQuery = {}
  ): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
    try {
      // Validar parámetros de query
      const validatedQuery = SupplierQuerySchema.parse(query)

      const {
        search,
        has_debt,
        balance_min,
        balance_max,
        page = 1,
        limit = 20
      } = validatedQuery

      // Construir query base
      let queryBuilder = this.supabase
        .from('suppliers')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenantId)

      // Aplicar filtros
      if (search) {
        queryBuilder = queryBuilder.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      // Calcular offset para paginación
      const offset = (page - 1) * limit

      // Obtener datos con paginación
      const { data, error, count } = await queryBuilder
        .order('name', { ascending: true })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Supplier search error:', error)
        return {
          success: false,
          message: error.message || 'Failed to search suppliers',
          error: 'SUPPLIER_SEARCH_ERROR'
        }
      }

      // Calcular metadata de paginación
      const total = count || 0
      const totalPages = Math.ceil(total / limit)

      const paginationMeta: PaginationMeta = {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }

      // Aplicar lógica de cuenta corriente si se solicita
      let suppliersWithBalance = data as Supplier[]
      if (has_debt !== undefined || balance_min !== undefined || balance_max !== undefined) {
        suppliersWithBalance = await this.applyBalanceLogic(data as Supplier[], {
          has_debt,
          balance_min,
          balance_max
        })
      }

      return {
        success: true,
        message: 'Suppliers retrieved successfully',
        data: {
          items: suppliersWithBalance,
          pagination: paginationMeta
        }
      }
    } catch (error) {
      console.error('Supplier query validation error:', error)
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Query validation error',
          error: 'SUPPLIER_QUERY_ERROR',
          details: error instanceof Error ? error.message : null
        }
    }
  }

  /**
   * Actualizar proveedor con validación y business rules
   */
  async update(id: string, tenantId: string, updateData: UpdateSupplier): Promise<ApiResponse<Supplier>> {
    try {
      // Validar datos de actualización
      const validatedData = UpdateSupplierSchema.parse(updateData)

      // Verificar si el proveedor existe y pertenece al tenant
      const existingSupplier = await this.findById(id, tenantId)
      if (!existingSupplier) {
        return {
          success: false,
          message: 'Supplier not found or access denied',
          error: 'SUPPLIER_NOT_FOUND'
        }
      }

      // Si se actualiza email, verificar unicidad
      if (validatedData.email && validatedData.email !== existingSupplier.email) {
        const emailExists = await this.findByEmail(validatedData.email, tenantId)
        if (emailExists) {
          return {
            success: false,
            message: 'Email already exists in this tenant',
            error: 'SUPPLIER_EMAIL_EXISTS'
          }
        }
      }

      const { data, error } = await this.supabase
        .from('suppliers')
        .update({
          name: validatedData.name,
          email: validatedData.email || null,
          phone: validatedData.phone || null,
          address: validatedData.address || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single()

      if (error) {
        console.error('Supplier update error:', error)
        return {
          success: false,
          message: error.message || 'Failed to update supplier',
          error: 'SUPPLIER_UPDATE_ERROR'
        }
      }

      return {
        success: true,
        message: 'Supplier updated successfully',
        data: data as Supplier
      }
    } catch (error) {
      console.error('Supplier update validation error:', error)
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Validation error',
          error: 'SUPPLIER_UPDATE_VALIDATION_ERROR',
          details: error instanceof Error ? error.message : null
        }
    }
  }

  /**
   * Eliminar proveedor con validaciones de negocio
   */
  async delete(id: string, tenantId: string): Promise<ApiResponse<void>> {
    try {
      // Verificar si el proveedor existe
      const existingSupplier = await this.findById(id, tenantId)
      if (!existingSupplier) {
        return {
          success: false,
          message: 'Supplier not found or access denied',
          error: 'SUPPLIER_NOT_FOUND'
        }
      }

      // Verificar si el proveedor tiene balance pendiente
      const balance = await this.getSupplierBalance(id, tenantId)
      if (balance > 0) {
        return {
          success: false,
          message: `Cannot delete supplier with outstanding balance of $${balance.toFixed(2)}`,
          error: 'SUPPLIER_HAS_BALANCE'
        }
      }

      const { error } = await this.supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
        .eq('tenant_id', tenantId)

      if (error) {
        console.error('Supplier delete error:', error)
        return {
          success: false,
          message: error.message || 'Failed to delete supplier',
          error: 'SUPPLIER_DELETE_ERROR'
        }
      }

      return {
        success: true,
        message: 'Supplier deleted successfully'
      }
    } catch (error) {
      console.error('Supplier delete error:', error)
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Delete validation error',
          error: 'SUPPLIER_DELETE_VALIDATION_ERROR',
          details: error instanceof Error ? error.message : null
        }
    }
  }

  /**
   * Buscar proveedores por nombre con paginación
   */
  async searchByName(name: string, tenantId: string, pagination: PaginationParams): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
    const query: SupplierQuery = {
      search: name,
      page: pagination.page,
      limit: pagination.limit
    }

    return this.findByTenantId(tenantId, query)
  }

  // =============================================================================
  // MÉTODOS DE CUENTA CORRIENTE
  // =============================================================================

  /**
   * Obtener balance actual del proveedor
   */
  private async getSupplierBalance(supplierId: string, tenantId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_supplier_balance', {
          p_supplier_uuid: supplierId,
          p_tenant_uuid: tenantId
        })

      if (error) {
        console.error('Balance calculation error:', error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error('Balance calculation exception:', error)
      return 0
    }
  }

  /**
   * Aplicar lógica de cuenta corriente a lista de proveedores
   */
  private async applyBalanceLogic(
    suppliers: Supplier[], 
    filters: {
      has_debt?: boolean
      balance_min?: number
      balance_max?: number
    }
  ): Promise<Supplier[]> {
    if (!filters.has_debt && !filters.balance_min && !filters.balance_max) {
      return suppliers
    }

    // Para cada proveedor, calcular balance y aplicar filtros
    const suppliersWithBalance = await Promise.all(
      suppliers.map(async (supplier) => {
        const balance = await this.getSupplierBalance(supplier.id, supplier.tenant_id)
        
        // Determinar si cumple con los filtros
        let includeSupplier = true
        
        if (filters.has_debt !== undefined) {
          includeSupplier = filters.has_debt ? balance > 0 : balance <= 0
        }
        
        if (filters.balance_min !== undefined) {
          includeSupplier = includeSupplier && balance >= filters.balance_min!
        }
        
        if (filters.balance_max !== undefined) {
          includeSupplier = includeSupplier && balance <= filters.balance_max!
        }

        return includeSupplier ? {
          ...supplier,
          balance,
          balance_to_pay: Math.max(0, balance), // Solo valores positivos
          account_status: this.getAccountStatus(balance),
          last_payment_date: await this.getLastPaymentDate(supplier.id, supplier.tenant_id)
        } : supplier
      })
    )

    return suppliersWithBalance.filter(Boolean)
  }

  /**
   * Determinar estado de cuenta del proveedor
   */
  private getAccountStatus(balance: number): string {
    if (balance === 0) return 'al_dia'
    if (balance > 0 && balance <= 30) return 'pendiente_menor_30'
    if (balance > 30 && balance <= 60) return 'pendiente_31_60'
    if (balance > 60 && balance <= 90) return 'pendiente_61_90'
    if (balance > 90) return 'pendiente_mayor_90'
    return 'desconocido'
  }

  /**
   * Obtener fecha del último pago
   */
  private async getLastPaymentDate(supplierId: string, tenantId: string): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('ledger_entries')
        .select('created_at')
        .eq('entity_type', 'supplier')
        .eq('entity_id', supplierId)
        .eq('tenant_id', tenantId)
        .eq('type', 'credit') // Credit = payment reduces debt
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        return null
      }

      return data.created_at
    } catch (error) {
      console.error('Last payment date error:', error)
      return null
    }
  }
}

// =============================================================================
// INTERFACES (mantener compatibilidad)
// =============================================================================

export interface ISupplierRepository {
  create(supplierData: CreateSupplier): Promise<ApiResponse<Supplier>>
  findById(id: string, tenantId: string): Promise<Supplier | null>
  findByEmail(email: string, tenantId: string): Promise<Supplier | null>
  findByTenantId(tenantId: string, query: SupplierQuery): Promise<ApiResponse<PaginatedResponse<Supplier>>>
  update(id: string, tenantId: string, data: UpdateSupplier): Promise<ApiResponse<Supplier>>
  delete(id: string, tenantId: string): Promise<ApiResponse<void>>
  searchByName(name: string, tenantId: string, pagination: PaginationParams): Promise<ApiResponse<PaginatedResponse<Supplier>>>
}