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
    entityType: 'customer' | 'supplier',
    entityId: string,
    type: 'credit' | 'debit',
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<LedgerEntry> {
    // Verify entity exists
    if (entityType === 'customer') {
      const customer = await this.customerRepository.findById(entityId)
      if (!customer) {
        throw new Error('Customer not found')
      }
    } else {
      const supplier = await this.supplierRepository.findById(entityId)
      if (!supplier) {
        throw new Error('Supplier not found')
      }
    }

    const entryData = {
      entityType,
      entityId,
      type,
      amount,
      description,
      referenceId
    }

    return await this.ledgerRepository.create(entryData)
  }

  async recordCustomerCredit(
    customerId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<LedgerEntry> {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive')
    }

    return await this.createEntry(
      'customer',
      customerId,
      'credit',
      amount,
      description || 'Customer credit',
      referenceId
    )
  }

  async recordCustomerDebit(
    customerId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<LedgerEntry> {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive')
    }

    // Check if payment would exceed current balance
    const currentBalance = await this.getCustomerBalance(customerId)
    if (currentBalance < amount) {
      throw new Error(
        `Payment amount exceeds customer balance. Current: ${currentBalance}, Payment: ${amount}`
      )
    }

    return await this.createEntry(
      'customer',
      customerId,
      'debit',
      amount,
      description || 'Customer payment',
      referenceId
    )
  }

  async recordSupplierDebit(
    supplierId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<LedgerEntry> {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive')
    }

    return await this.createEntry(
      'supplier',
      supplierId,
      'debit',
      amount,
      description || 'Supplier purchase',
      referenceId
    )
  }

  async recordSupplierCredit(
    supplierId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<LedgerEntry> {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive')
    }

    // Check if payment would exceed current balance
    const currentBalance = await this.getSupplierBalance(supplierId)
    if (currentBalance < amount) {
      throw new Error(
        `Payment amount exceeds supplier balance. Current: ${currentBalance}, Payment: ${amount}`
      )
    }

    return await this.createEntry(
      'supplier',
      supplierId,
      'credit',
      amount,
      description || 'Supplier payment',
      referenceId
    )
  }

  async getCustomerBalance(customerId: string): Promise<number> {
    return await this.ledgerRepository.calculateEntityBalance('customer', customerId)
  }

  async getSupplierBalance(supplierId: string): Promise<number> {
    return await this.ledgerRepository.calculateEntityBalance('supplier', supplierId)
  }

  async getCustomerLedgerEntries(
    customerId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<LedgerEntry>> {
    return await this.ledgerRepository.findByEntity('customer', customerId, pagination)
  }

  async getSupplierLedgerEntries(
    supplierId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<LedgerEntry>> {
    return await this.ledgerRepository.findByEntity('supplier', supplierId, pagination)
  }

  async getLedgerEntriesByTenant(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<LedgerEntry>> {
    return await this.ledgerRepository.findByTenantId(pagination)
  }

  async getLedgerEntriesByDateRange(
    startDate: Date,
    endDate: Date,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<LedgerEntry>> {
    return await this.ledgerRepository.findByDateRange(
      startDate,
      endDate,
      pagination
    )
  }

  async getLedgerEntryById(id: string): Promise<LedgerEntry | null> {
    return await this.ledgerRepository.findById(id)
  }
}