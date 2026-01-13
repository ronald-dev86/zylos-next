import { ILedgerEntryRepository } from '@/core/services/ILedgerEntryRepository'
import { LedgerEntry } from '@/core/entities/LedgerEntry'
import { BaseRepository } from './BaseRepository'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseLedgerEntryRepository extends BaseRepository<LedgerEntry> implements ILedgerEntryRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  protected mapToEntity(data: any): LedgerEntry {
    return new LedgerEntry({
      id: data.id,
      tenantId: data.tenant_id,
      entityType: data.entity_type,
      entityId: data.entity_id,
      type: data.type,
      amount: data.amount,
      description: data.description,
      referenceId: data.reference_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }

  protected getTableName(): string {
    return 'ledger_entries'
  }

  async create(entry: {
    entityType: string
    entityId: string
    type: 'debit' | 'credit'
    amount: number
    description: string
    referenceId?: string
  }): Promise<LedgerEntry> {
    const { data, error } = await this.withTenantFilter()
      .from('ledger_entries')
      .insert([{
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        type: entry.type,
        amount: entry.amount,
        description: entry.description,
        reference_id: entry.referenceId
      }])
      .select()
      .single()

    if (error) throw new Error(`Failed to create ledger entry: ${error.message}`)
    return this.mapToEntity(data)
  }

  async findById(id: string): Promise<LedgerEntry | null> {
    return await this.findByIdInternal(id)
  }

  async findByEntityType(entityType: string, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>> {
    const query = this.withTenantFilter()
      .from('ledger_entries')
      .select('*')
      .eq('entity_type', entityType)
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async findByEntityId(entityId: string, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>> {
    const query = this.withTenantFilter()
      .from('ledger_entries')
      .select('*')
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>> {
    const query = this.withTenantFilter()
      .from('ledger_entries')
      .select('*')
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async findByDateRange(startDate: Date, endDate: Date, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>> {
    const query = this.withTenantFilter()
      .from('ledger_entries')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async getBalanceByEntityType(entityType: string): Promise<number> {
    const { data, error } = await this.withTenantFilter()
      .from('ledger_entries')
      .select('amount, type')
      .eq('entity_type', entityType)

    if (error) throw new Error(`Failed to get balance: ${error.message}`)
    if (!data) return 0

    return data.reduce((balance, entry) => {
      return entry.type === 'credit' ? balance + entry.amount : balance - entry.amount
    }, 0)
  }
}