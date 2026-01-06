import { LedgerEntry } from '../entities/LedgerEntry'
import { ILedgerEntryRepository } from '../services/ILedgerEntryRepository'
import { ICustomerRepository } from '../services/ICustomerRepository'
import { ISupplierRepository } from '../services/ISupplierRepository'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class LedgerService {
  constructor(
    private ledgerRepository: ILedgerEntryRepository,
    private customerRepository: ICustomerRepository,
    private supplierRepository: ISupplierRepository
  ) {}

  async createEntry(
    tenantId: string,
    entityType: 'customer' | 'supplier',
    entityId: string,
    type: 'credit' | 'debit',
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<LedgerEntry> {
    // Verify entity exists and belongs to tenant
    if (entityType === 'customer') {
      const customer = await this.customerRepository.findById(entityId, tenantId)
      if (!customer) {
        throw new Error('Customer not found')
      }
    } else {
      const supplier = await this.supplierRepository.findById(entityId, tenantId)
      if (!supplier) {
        throw new Error('Supplier not found')
      }
    }

    const entryData = LedgerEntry.create(
      tenantId,
      entityType,
      entityId,
      type,
      amount,
      description,
      referenceId
    )

    return await this.ledgerRepository.create(entryData)
  }

  async recordCustomerCredit(
    tenantId: string,
    customerId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<LedgerEntry> {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive')
    }

    return await this.createEntry(
      tenantId,
      'customer',
      customerId,
      'credit',
      amount,
      description || 'Customer credit',
      referenceId
    )
  }

  async recordCustomerDebit(
    tenantId: string,
    customerId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<LedgerEntry> {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive')
    }

    // Check if payment would exceed current balance
    const currentBalance = await this.getCustomerBalance(customerId, tenantId)
    if (currentBalance < amount) {
      throw new Error(
        `Payment amount exceeds customer balance. Current: ${currentBalance}, Payment: ${amount}`
      )
    }

    return await this.createEntry(
      tenantId,
      'customer',
      customerId,
      'debit',
      amount,
      description || 'Customer payment',
      referenceId
    )
  }

  async recordSupplierDebit(
    tenantId: string,
    supplierId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<LedgerEntry> {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive')
    }

    return await this.createEntry(
      tenantId,
      'supplier',
      supplierId,
      'debit',
      amount,
      description || 'Supplier purchase',
      referenceId
    )
  }

  async recordSupplierCredit(
    tenantId: string,
    supplierId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<LedgerEntry> {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive')
    }

    // Check if payment would exceed current balance
    const currentBalance = await this.getSupplierBalance(supplierId, tenantId)
    if (currentBalance < amount) {
      throw new Error(
        `Payment amount exceeds supplier balance. Current: ${currentBalance}, Payment: ${amount}`
      )
    }

    return await this.createEntry(
      tenantId,
      'supplier',
      supplierId,
      'credit',
      amount,
      description || 'Supplier payment',
      referenceId
    )
  }

  async getCustomerBalance(customerId: string, tenantId: string): Promise<number> {
    return await this.ledgerRepository.calculateEntityBalance(
      'customer',
      customerId,
      tenantId
    )
  }

  async getSupplierBalance(supplierId: string, tenantId: string): Promise<number> {
    return await this.ledgerRepository.calculateEntityBalance(
      'supplier',
      supplierId,
      tenantId
    )
  }

  async getCustomerLedgerEntries(
    customerId: string,
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<LedgerEntry>> {
    return await this.ledgerRepository.findByEntity(
      'customer',
      customerId,
      tenantId,
      pagination
    )
  }

  async getSupplierLedgerEntries(
    supplierId: string,
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<LedgerEntry>> {
    return await this.ledgerRepository.findByEntity(
      'supplier',
      supplierId,
      tenantId,
      pagination
    )
  }

  async getLedgerEntriesByTenant(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<LedgerEntry>> {
    return await this.ledgerRepository.findByTenantId(tenantId, pagination)
  }

  async getLedgerEntriesByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<LedgerEntry>> {
    return await this.ledgerRepository.findByDateRange(
      startDate,
      endDate,
      tenantId,
      pagination
    )
  }

  async getLedgerEntryById(id: string, tenantId: string): Promise<LedgerEntry | null> {
    return await this.ledgerRepository.findById(id, tenantId)
  }
}