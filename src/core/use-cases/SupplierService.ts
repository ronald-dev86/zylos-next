import { 
  Supplier, 
  CreateSupplier, 
  UpdateSupplier,
  SupplierQuery,
  ApiResponse,
  PaginatedResponse 
} from '@/shared/types/schemas'
import { PaginationParams } from '@/shared/types/common'
import { SupplierRepository } from '@/infrastructure/database/SupplierRepository'
import { LedgerEntryRepository } from '@/infrastructure/database/LedgerEntryRepository'

/**
 * Servicio de Proveedores con reglas de negocio y validación
 */
export class SupplierService {
  constructor(
    private supplierRepository: SupplierRepository,
    private ledgerRepository: LedgerEntryRepository
  ) {}

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  /**
   * Crear nuevo proveedor con validación completa y business rules
   */
  async createSupplier(
    tenantId: string,
    supplierData: Omit<CreateSupplier, 'tenant_id'>
  ): Promise<ApiResponse<Supplier>> {
    try {
      // Validar datos de entrada
      const validatedData = CreateSupplierSchema.parse(supplierData)

      // Verificar unicidad del email en el tenant
      if (validatedData.email) {
        const existingSupplier = await this.supplierRepository.findByEmail(
          validatedData.email, 
          tenantId
        )
        if (existingSupplier) {
          return {
            success: false,
            message: 'Email already exists in this tenant',
            error: 'SUPPLIER_EMAIL_EXISTS',
            details: {
              field: 'email',
              existingId: existingSupplier.id
            }
          }
        }
      }

      // Crear proveedor con tenant_id
      const completeSupplierData = {
        ...validatedData,
        tenant_id: tenantId
      }

      return await this.supplierRepository.create(completeSupplierData)
    } catch (error) {
      console.error('Supplier creation error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Validation error',
        error: 'SUPPLIER_CREATION_ERROR',
        details: error instanceof Error ? { validationError: error.message } : null
      }
    }
  }

  /**
   * Obtener proveedor por ID con validación de tenant
   */
  async getSupplierById(id: string, tenantId: string): Promise<ApiResponse<Supplier | null>> {
    try {
      const supplier = await this.supplierRepository.findById(id, tenantId)
      
      if (!supplier) {
        return {
          success: false,
          message: 'Supplier not found or access denied',
          error: 'SUPPLIER_NOT_FOUND'
        }
      }

      // Obtener balance actual del proveedor
      const balance = await this.getSupplierBalance(id, tenantId)
      
      return {
        success: true,
        message: 'Supplier retrieved successfully',
        data: {
          ...supplier,
          balance,
          balance_to_pay: Math.max(0, balance),
          account_status: this.getAccountStatus(balance)
        }
      }
    } catch (error) {
      console.error('Supplier retrieval error:', error)
      return {
        success: false,
        message: 'Failed to retrieve supplier',
        error: 'SUPPLIER_RETRIEVAL_ERROR'
      }
    }
  }

  /**
   * Obtener proveedores por tenant con paginación, filtros y cuenta corriente
   */
  async getSuppliersByTenant(
    tenantId: string, 
    query: SupplierQuery = {}
  ): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
    try {
      // Validar parámetros de consulta
      const validatedQuery = SupplierQuerySchema.parse(query)

      return await this.supplierRepository.findByTenantId(tenantId, validatedQuery)
    } catch (error) {
      console.error('Supplier query error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Query validation error',
        error: 'SUPPLIER_QUERY_ERROR',
        details: error instanceof Error ? { validationError: error.message } : null
      }
    }
  }

  /**
   * Actualizar proveedor con validación y business rules
   */
  async updateSupplier(
    id: string,
    tenantId: string,
    updateData: Omit<UpdateSupplier, 'tenant_id'>
  ): Promise<ApiResponse<Supplier>> {
    try {
      // Validar datos de actualización
      const validatedData = UpdateSupplierSchema.parse(updateData)

      // Verificar que el proveedor existe y pertenece al tenant
      const existingSupplier = await this.supplierRepository.findById(id, tenantId)
      if (!existingSupplier) {
        return {
          success: false,
          message: 'Supplier not found or access denied',
          error: 'SUPPLIER_NOT_FOUND'
        }
      }

      // Si se actualiza email, verificar unicidad (excluyendo el actual)
      if (validatedData.email && validatedData.email !== existingSupplier.email) {
        const emailExists = await this.supplierRepository.findByEmail(
          validatedData.email, 
          tenantId
        )
        if (emailExists) {
          return {
            success: false,
            message: 'Email already exists in this tenant',
            error: 'SUPPLIER_EMAIL_EXISTS',
            details: {
              field: 'email',
              conflictingId: emailExists.id
            }
          }
        }
      }

      const completeUpdateData = {
        ...validatedData,
        tenant_id: tenantId
      }

      return await this.supplierRepository.update(id, tenantId, completeUpdateData)
    } catch (error) {
      console.error('Supplier update error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Validation error',
        error: 'SUPPLIER_UPDATE_ERROR',
        details: error instanceof Error ? { validationError: error.message } : null
      }
    }
  }

  /**
   * Eliminar proveedor con validaciones de negocio
   */
  async deleteSupplier(id: string, tenantId: string): Promise<ApiResponse<void>> {
    try {
      // Verificar balance pendiente antes de eliminar
      const balance = await this.getSupplierBalance(id, tenantId)
      
      if (balance > 0) {
        return {
          success: false,
          message: `Cannot delete supplier with outstanding balance of $${balance.toFixed(2)}`,
          error: 'SUPPLIER_HAS_OUTSTANDING_BALANCE',
          details: {
            balance,
            balance_to_pay: balance
          }
        }
      }

      // Verificar si hay transacciones recientes (protección contra eliminación accidental)
      const recentTransactions = await this.getRecentTransactions(id, tenantId)
      if (recentTransactions.length > 0) {
        return {
          success: false,
          message: 'Cannot delete supplier with recent transactions (last 30 days)',
          error: 'SUPPLIER_HAS_RECENT_TRANSACTIONS',
          details: {
            recentTransactionsCount: recentTransactions.length,
            daysThreshold: 30
          }
        }
      }

      return await this.supplierRepository.delete(id, tenantId)
    } catch (error) {
      console.error('Supplier deletion error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Deletion validation error',
        error: 'SUPPLIER_DELETION_ERROR'
      }
    }
  }

  /**
   * Buscar proveedores por nombre con paginación
   */
  async searchSuppliers(
    name: string,
    tenantId: string,
    pagination: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<Supplier>>> {
    try {
      if (!name || name.trim().length === 0) {
        return {
          success: false,
          message: 'Search term is required',
          error: 'SUPPLIER_SEARCH_TERM_REQUIRED'
        }
      }

      const query: SupplierQuery = {
        search: name.trim(),
        ...pagination
      }

      return await this.supplierRepository.findByTenantId(tenantId, query)
    } catch (error) {
      console.error('Supplier search error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Search error',
        error: 'SUPPLIER_SEARCH_ERROR'
      }
    }
  }

  // =============================================================================
  // BUSINESS LOGIC - CUENTA CORRIENTE
  // =============================================================================

  /**
   * Obtener balance actual del proveedor desde el ledger
   */
  async getSupplierBalance(supplierId: string, tenantId: string): Promise<number> {
    try {
      const result = await this.ledgerRepository.calculateEntityBalance(
        'supplier',
        supplierId,
        tenantId
      )
      
      return result.balance || 0
    } catch (error) {
      console.error('Balance calculation error:', error)
      return 0
    }
  }

  /**
   * Obtener proveedores con estado de cuenta corriente
   */
  async getSuppliersWithBalance(
    tenantId: string,
    query: SupplierQuery = {}
  ): Promise<ApiResponse<PaginatedResponse<Supplier & { 
    balance: number
    balance_to_pay: number
    account_status: string 
    last_payment_date: string | null
    credit_limit: number
  }>>> {
    try {
      // Primero obtener proveedores base
      const suppliersResponse = await this.getSuppliersByTenant(tenantId, query)
      
      if (!suppliersResponse.success) {
        return suppliersResponse as ApiResponse<any>
      }

      // Enriquecer con información de cuenta corriente
      const enrichedSuppliers = await Promise.all(
        suppliersResponse.data!.items.map(async (supplier) => {
          const balance = await this.getSupplierBalance(supplier.id, supplier.tenant_id)
          const lastPayment = await this.getLastPaymentDate(supplier.id, supplier.tenant_id)
          
          return {
            ...supplier,
            balance,
            balance_to_pay: Math.max(0, balance),
            account_status: this.getAccountStatus(balance),
            last_payment_date: lastPayment,
            credit_limit: this.calculateCreditLimit(supplier, balance)
          }
        })
      )

      return {
        ...suppliersResponse,
        data: {
          ...suppliersResponse.data!,
          items: enrichedSuppliers
        }
      }
    } catch (error) {
      console.error('Suppliers with balance error:', error)
      return {
        success: false,
        message: 'Failed to retrieve suppliers with balance',
        error: 'SUPPLIERS_BALANCE_ERROR'
      }
    }
  }

  /**
   * Procesar pago a proveedor con validaciones
   */
  async processSupplierPayment(
    supplierId: string,
    tenantId: string,
    paymentData: {
      amount: number
      description?: string
      payment_method: string
      reference_number?: string
    }
  ): Promise<ApiResponse<any>> {
    try {
      // Validar datos de pago
      if (paymentData.amount <= 0) {
        return {
          success: false,
          message: 'Payment amount must be greater than 0',
          error: 'SUPPLIER_INVALID_PAYMENT_AMOUNT'
        }
      }

      // Obtener balance actual
      const currentBalance = await this.getSupplierBalance(supplierId, tenantId)
      
      if (currentBalance <= 0) {
        return {
          success: false,
          message: 'This supplier has no outstanding balance',
          error: 'SUPPLIER_NO_OUTSTANDING_BALANCE'
        }
      }

      if (paymentData.amount > currentBalance) {
        return {
          success: false,
          message: `Payment amount ($${paymentData.amount.toFixed(2)}) exceeds outstanding balance ($${currentBalance.toFixed(2)})`,
          error: 'SUPPLIER_PAYMENT_EXCEEDS_BALANCE'
        }
      }

      // Registrar payment en el ledger
      const paymentResult = await this.ledgerRepository.createEntry({
        tenant_id: tenantId,
        entity_type: 'supplier',
        entity_id: supplierId,
        type: 'credit', // Credit reduce supplier debt
        amount: paymentData.amount,
        description: paymentData.description || `Payment - ${paymentData.payment_method}`,
        reference_id: null
      })

      return paymentResult
    } catch (error) {
      console.error('Supplier payment error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Payment processing error',
        error: 'SUPPLIER_PAYMENT_ERROR'
      }
    }
  }

  /**
   * Obtener transacciones recientes del proveedor
   */
  async getSupplierTransactions(
    supplierId: string,
    tenantId: string,
    pagination: PaginationParams
  ): Promise<ApiResponse<PaginatedResponse<any>>> {
    try {
      return await this.ledgerRepository.findByEntity(
        'supplier',
        supplierId,
        tenantId,
        pagination
      )
    } catch (error) {
      console.error('Supplier transactions error:', error)
      return {
        success: false,
        message: 'Failed to retrieve supplier transactions',
        error: 'SUPPLIER_TRANSACTIONS_ERROR'
      }
    }
  }

  // =============================================================================
  // PRIVATE HELPERS
  // =============================================================================

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
   * Calcular límite de crédito basado en historial y perfil
   */
  private calculateCreditLimit(supplier: Supplier, currentBalance: number): number {
    // Lógica simple: basada en antiguedad y monto actual
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(supplier.created_at).getTime()) / (1000 * 60 * 60 * 24)
    )
    
    let baseLimit = 1000
    
    // Aumentar límite por antiguedad
    if (daysSinceCreation > 365) baseLimit = 10000
    else if (daysSinceCreation > 180) baseLimit = 5000
    else if (daysSinceCreation > 90) baseLimit = 2500
    
    // Ajustar por balance actual
    return Math.max(baseLimit, currentBalance * 2)
  }

  /**
   * Obtener fecha del último pago
   */
  private async getLastPaymentDate(supplierId: string, tenantId: string): Promise<string | null> {
    try {
      const transactions = await this.ledgerRepository.findByEntity(
        'supplier',
        supplierId,
        tenantId,
        { page: 1, limit: 1 }
      )
      
      return transactions.success && transactions.data?.items.length > 0
        ? transactions.data.items[0].created_at
        : null
    } catch (error) {
      console.error('Last payment date error:', error)
      return null
    }
  }

  /**
   * Obtener transacciones recientes (últimos 30 días)
   */
  private async getRecentTransactions(supplierId: string, tenantId: string): Promise<any[]> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const result = await this.ledgerRepository.findByEntity(
        'supplier',
        supplierId,
        tenantId,
        {
          page: 1,
          limit: 100
        }
      )

      if (!result.success) {
        return []
      }

      // Filtrar transacciones de los últimos 30 días
      return result.data!.items.filter((transaction: any) => 
        new Date(transaction.created_at) >= thirtyDaysAgo
      )
    } catch (error) {
      console.error('Recent transactions error:', error)
      return []
    }
  }
}