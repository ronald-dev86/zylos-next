import { LedgerEntry } from '../entities/LedgerEntry'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface ILedgerEntryRepository {
  create(entry: {
    entityType: 'customer' | 'supplier'
    entityId: string
    type: 'credit' | 'debit'
    amount: number
    description?: string
    referenceId?: string
  }): Promise<LedgerEntry>
  findById(id: string): Promise<LedgerEntry | null>
  findByEntity(entityType: 'customer' | 'supplier', entityId: string, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>>
  findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>>
  calculateEntityBalance(entityType: 'customer' | 'supplier', entityId: string): Promise<number>
  findByDateRange(startDate: Date, endDate: Date, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>>
}