import { LedgerEntry } from '@/core/entities/LedgerEntry'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface ILedgerEntryRepository {
  create(entry: {
    entityType: string
    entityId: string
    type: 'debit' | 'credit'
    amount: number
    description: string
    referenceId?: string
  }): Promise<LedgerEntry>
  findById(id: string): Promise<LedgerEntry | null>
  findByEntityType(entityType: string, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>>
  findByEntityId(entityId: string, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>>
  findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>>
  findByDateRange(startDate: Date, endDate: Date, pagination: PaginationParams): Promise<PaginatedResponse<LedgerEntry>>
  getBalanceByEntityType(entityType: string): Promise<number>
}