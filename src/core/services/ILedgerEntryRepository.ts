import { LedgerEntry } from '../entities/LedgerEntry'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface ILedgerEntryRepository {
  create(entry: {
    tenantId: string
    entityType: 'customer' | 'supplier'
    entityId: string
    type: 'credit' | 'debit'
    amount: number
    description?: string
    referenceId?: string
  }): Promise<LedgerEntry>
  findById(id: string, tenantId: string): Promise<LedgerEntry | null>
  findByEntity(entityType: 'customer' | 'supplier', entityId: string, tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>>
  findByTenantId(tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>>
  calculateEntityBalance(entityType: 'customer' | 'supplier', entityId: string, tenantId: string): Promise<number>
  findByDateRange(startDate: Date, endDate: Date, tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>>
}