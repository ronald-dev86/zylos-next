import { ILedgerEntryRepository } from '@/core/services/ILedgerEntryRepository'
import { LedgerEntry } from '@/core/entities/LedgerEntry'
import { BaseService } from './BaseService'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseLedgerEntryRepository extends BaseService implements ILedgerEntryRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  async create(entry: {
    entityType: 'customer' | 'supplier'
    entityId: string
    type: 'credit' | 'debit'
    amount: number
    description?: string
    referenceId?: string
  }): Promise<LedgerEntry> {
    // Use RPC function for immutable ledger entry creation
    const result = await this.rpc<{ id: string; created_at: string }>('create_ledger_entry', {
      p_entity_type: entry.entityType,
      p_entity_id: entry.entityId,
      p_type: entry.type,
      p_amount: entry.amount,
      p_description: entry.description,
      p_reference_id: entry.referenceId
    })

    return new LedgerEntry({
      id: result.id,
      tenantId: this.tenantId!,
      entityType: entry.entityType,
      entityId: entry.entityId,
      type: entry.type,
      amount: entry.amount,
      description: entry.description,
      referenceId: entry.referenceId,
      createdAt: new Date(result.created_at)
    })
  }

  async findById(id: string): Promise<LedgerEntry | null> {
    const { data, error } = await this.withTenantFilter()
      .from('ledger_entries')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (error) throw new Error(`Failed to find ledger entry: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToLedgerEntry(data[0])
  }

  async findByEntity(
    entityType: 'customer' | 'supplier',
    entityId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<LedgerEntry>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('ledger_entries')
      .select('*', { count: 'exact' })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find entries by entity: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToLedgerEntry),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('ledger_entries')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find entries by tenant: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToLedgerEntry),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async calculateEntityBalance(
    entityType: 'customer' | 'supplier',
    entityId: string
  ): Promise<number> {
    const result = await this.rpc<{ balance: number }>('calculate_entity_balance', {
      p_entity_type: entityType,
      p_entity_id: entityId
    })

    return result.balance
  }

  async findByDateRange(startDate: Date, endDate: Date, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('ledger_entries')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find entries by date range: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToLedgerEntry),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  private mapToLedgerEntry(data: Database['public']['Tables']['ledger_entries']['Row']): LedgerEntry {
    return new LedgerEntry({
      id: data.id,
      tenantId: data.tenant_id,
      entityType: data.entity_type,
      entityId: data.entity_id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      referenceId: data.reference_id,
      createdAt: new Date(data.created_at)
    })
  }
}