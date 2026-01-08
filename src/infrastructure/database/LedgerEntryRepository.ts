import { createClient } from '@/infrastructure/supabase-client/client'
import { Database } from '@/shared/types/database'
import { 
  LedgerEntry, 
  CreateLedgerEntry,
  LedgerQuery,
  ApiResponse,
  CreateLedgerEntrySchema
} from '@/shared/types/schemas'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'
import { PaginationMeta } from '@/shared/types/schemas'

/**
 * Repositorio de Ledger Entries con validación Zod y cálculos de balance
 */
export class LedgerEntryRepository {
  private supabase = createClient()

  // =============================================================================
  // CRUD OPERATIONS
  // =============================================================================

  /**
   * Crear nueva entrada en el ledger con validación
   */
  async createEntry(entryData: CreateLedgerEntry): Promise<ApiResponse<LedgerEntry>> {
    try {
      // Validar datos de entrada
      const validatedData = CreateLedgerEntrySchema.parse(entryData)
      
      const { data, error } = await this.supabase
        .from('ledger_entries')
        .insert({
          tenant_id: (validatedData as any).tenant_id,
          entity_type: validatedData.entity_type,
          entity_id: validatedData.entity_id,
          type: validatedData.type,
          amount: validatedData.amount,
          description: validatedData.description,
          reference_id: validatedData.reference_id
        } as any)
        .select()
        .single()

      if (error) {
        console.error('Ledger entry creation error:', error)
        return {
          success: false,
          message: error.message || 'Failed to create ledger entry',
          error: 'LEDGER_ENTRY_CREATE_ERROR'
        }
      }

      return {
        success: true,
        message: 'Ledger entry created successfully',
        data: data as LedgerEntry
      }
    } catch (error) {
      console.error('Ledger entry validation error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Validation error',
        error: 'LEDGER_ENTRY_VALIDATION_ERROR'
      }
    }
  }

  /**
   * Obtener entradas por entidad con paginación
   */
  async findByEntity(
    entity_type: string,
    entity_id: string,
    tenant_id: string,
    pagination: PaginationParams = {
      page: 1,
      limit: 50
    }
  ): Promise<ApiResponse<any>> {
    try {
      const {
        page = 1,
        limit = 50
      } = pagination
      
      const { date_from, date_to, min_amount, max_amount, type } = pagination as any

      let query = this.supabase
        .from('ledger_entries')
        .select('*', { count: 'exact' })
        .eq('tenant_id', tenant_id)
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id)

      // Aplicar filtros adicionales
      if (type) {
        query = query.eq('type', type)
      }
      
      if (date_from) {
        query = query.gte('created_at', date_from)
      }
      
      if (date_to) {
        query = query.lte('created_at', date_to)
      }
      
      if (min_amount) {
        query = query.gte('amount', min_amount)
      }
      
      if (max_amount) {
        query = query.lte('amount', max_amount)
      }

      // Calcular offset para paginación
      const offset = (page - 1) * limit

      // Ejecutar query con paginación
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Ledger entries search error:', error)
        return {
          success: false,
          message: error.message || 'Failed to search ledger entries',
          error: 'LEDGER_ENTRIES_SEARCH_ERROR'
        }
      }

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

      return {
        success: true,
        message: 'Ledger entries retrieved successfully',
        data: {
          items: data as LedgerEntry[],
          pagination: paginationMeta
        }
      }
    } catch (error) {
      console.error('Ledger entries query error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Query validation error',
        error: 'LEDGER_ENTRIES_QUERY_ERROR'
      }
    }
  }

  /**
   * Obtener balance de una entidad (cliente/proveedor)
   */
  async calculateEntityBalance(
    entity_type: 'customer' | 'supplier',
    entity_id: string,
    tenant_id: string
  ): Promise<{ balance: number; success: boolean }> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_customer_balance' as any, {
          p_entity_type: entity_type === 'customer' ? 'customer' : 'supplier',
          p_entity_uuid: entity_id,
          p_tenant_uuid: tenant_id
        } as any)

      if (error) {
        console.error(`Balance calculation error for ${entity_type}:`, error)
        return { balance: 0, success: false }
      }

      const balance = data || 0
      return { balance, success: true }
    } catch (error) {
      console.error(`Balance calculation exception for ${entity_type}:`, error)
      return { balance: 0, success: false }
    }
  }

  /**
   * Obtener resumen de ledger por tenant
   */
  async getLedgerSummary(tenant_id: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_tenant_balance_summary' as any, {
          p_tenant_uuid: tenant_id
        } as any)

      if (error) {
        console.error('Ledger summary error:', error)
        return {
          success: false,
          message: error.message || 'Failed to get ledger summary',
          error: 'LEDGER_SUMMARY_ERROR'
        }
      }

      return {
        success: true,
        message: 'Ledger summary retrieved successfully',
        data: data
      }
    } catch (error) {
      console.error('Ledger summary exception:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Summary calculation error',
        error: 'LEDGER_SUMMARY_EXCEPTION'
      }
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Obtener entradas recientes por entidad
   */
  async getRecentEntries(
    entity_type: 'customer' | 'supplier',
    entity_id: string,
    tenant_id: string,
    limit: number = 10
  ): Promise<LedgerEntry[]> {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      const { data, error } = await this.supabase
        .from('ledger_entries')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('entity_type', entity_type)
        .eq('entity_id', entity_id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Recent entries error:', error)
        return []
      }

      return data as LedgerEntry[] || []
    } catch (error) {
      console.error('Recent entries exception:', error)
      return []
    }
  }

  /**
   * Obtener estadísticas de ledger
   */
  async getLedgerStats(tenant_id: string): Promise<ApiResponse<any>> {
    try {
      const { data, error } = await this.supabase
        .from('ledger_entries')
        .select('type, amount')
        .eq('tenant_id', tenant_id)
        
      if (error) {
        console.error('Ledger stats error:', error)
        return {
          success: false,
          message: error.message || 'Failed to get ledger stats',
          error: 'LEDGER_STATS_ERROR'
        }
      }

      // Calcular estadísticas
      const stats = {
        total_debits: 0,
        total_credits: 0,
        net_balance: 0,
        total_transactions: data?.length || 0
      }

      if (data && data.length > 0) {
        stats.total_debits = (data as any[])
          .filter((entry: any) => entry.type === 'debit')
          .reduce((sum: number, entry: any) => sum + entry.amount, 0)
        
        stats.total_credits = (data as any[])
          .filter((entry: any) => entry.type === 'credit')
          .reduce((sum: number, entry: any) => sum + entry.amount, 0)
        
        stats.net_balance = stats.total_debits - stats.total_credits
      }

      return {
        success: true,
        message: 'Ledger stats retrieved successfully',
        data: stats
      }
    } catch (error) {
      console.error('Ledger stats exception:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Stats calculation error',
        error: 'LEDGER_STATS_EXCEPTION'
      }
    }
  }

  /**
   * Validar límites de transacción
   */
  async validateTransactionLimits(
    entity_type: 'customer' | 'supplier',
    entity_id: string,
    tenant_id: string,
    amount: number,
    operation: 'credit' | 'debit'
  ): Promise<ApiResponse<{ valid: boolean; limit?: number }>> {
    try {
      // Obtener balance actual
      const { balance } = await this.calculateEntityBalance(entity_type, entity_id, tenant_id)
      
      let response: ApiResponse<{ valid: boolean; limit?: number }> = {
        success: true,
        message: 'Transaction validation completed',
        data: { valid: true }
      }

      // Para créditos (aumentos de deuda en proveedores), validar límite
      if (entity_type === 'supplier' && operation === 'credit') {
        const supplier = await this.supabase
          .from('suppliers')
          .select('name')
          .eq('id', entity_id)
          .eq('tenant_id', tenant_id)
          .single()

        if (!supplier.data) {
          return {
            success: false,
            message: 'Supplier not found',
            error: 'SUPPLIER_NOT_FOUND_FOR_VALIDATION'
          }
        }

        // Calcular límite de crédito basado en antiguedad y perfil
        const daysSinceCreation = Math.floor(
          (Date.now() - new Date((supplier as any).data.created_at).getTime()) / (1000 * 60 * 60 * 24)
        )
        
        let creditLimit = 1000
        if (daysSinceCreation > 365) creditLimit = 10000
        else if (daysSinceCreation > 180) creditLimit = 5000
        else if (daysSinceCreation > 90) creditLimit = 2500
        
        // Validar que no exceda el límite
        const newBalance = balance + amount
        if (newBalance > creditLimit) {
          response = {
            success: true,
            message: `Transaction would exceed credit limit of $${creditLimit.toFixed(2)}`,
            data: { 
              valid: false, 
              limit: creditLimit,
              current_balance: balance,
              proposed_amount: amount,
              new_balance: newBalance
            }
          }
        }
      }

      // Para débitos (pagos a proveedores), validar balance disponible
      if (entity_type === 'supplier' && operation === 'debit') {
        if (amount > balance) {
          response = {
            success: true,
            message: `Payment amount ($${amount.toFixed(2)}) exceeds available balance ($${balance.toFixed(2)})`,
            data: { 
              valid: false, 
              current_balance: balance,
              proposed_amount: amount
            }
          }
        }
      }

      // Para clientes, validar que no exceda límites de crédito
      if (entity_type === 'customer' && operation === 'credit') {
        const customer = await this.supabase
          .from('customers')
          .select('name')
          .eq('id', entity_id)
          .eq('tenant_id', tenant_id)
          .single()

        if (customer.data) {
          const customerBalance = balance + amount
          const creditLimit = 10000 // Límite genérico para clientes
          
          if (customerBalance > creditLimit * 0.5) { // 50% del límite
            response = {
              success: true,
              message: `Customer balance would exceed 50% credit limit of $${(creditLimit * 0.5).toFixed(2)}`,
              data: { 
                valid: false, 
                limit: creditLimit,
                current_balance: balance,
                proposed_amount: amount,
                new_balance: customerBalance
              }
            }
          }
        }
      }

      return response
    } catch (error) {
      console.error('Transaction validation error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Validation error',
        error: 'TRANSACTION_VALIDATION_ERROR'
      }
    }
  }
}