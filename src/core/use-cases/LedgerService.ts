import { Money } from '@/core/domain/value-objects/Money'
import { EntityType } from '@/core/domain/enums'
import { ILedgerEntryRepository } from '@/core/services/ILedgerEntryRepository'
import { ICustomerRepository } from '@/core/services/ICustomerRepository'
import { ISupplierRepository } from '@/core/services/ISupplierRepository'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'
import { FinancialService, type FinancialPeriod, type FinancialReport } from '@/core/domain/services/FinancialService'

export class LedgerService {
  constructor(
    private ledgerRepository: ILedgerEntryRepository,
    private customerRepository: ICustomerRepository,
    private supplierRepository: ISupplierRepository,
    private financialService: FinancialService
  ) {}

  async createEntry(
    entityType: 'customer' | 'supplier',
    entityId: string,
    type: 'credit' | 'debit',
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<any> {
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

    // Use domain service for complex financial operations
    if (entityType === 'customer' && type === 'credit') {
      return await this.financialService.recordCustomerCredit(
        entityId,
        new Money(amount),
        description,
        referenceId
      )
    }

    if (entityType === 'supplier' && type === 'debit') {
      return await this.financialService.recordSupplierDebit(
        entityId,
        new Money(amount),
        description,
        referenceId
      )
    }

    // Use domain service for financial validation
    if (entityType === 'customer' && type === 'debit') {
      const customerBalance = await this.financialService.getCustomerBalance(entityId)
      if (customerBalance.amount < amount) {
        throw new Error('Payment amount exceeds customer balance')
      }
    }

    if (entityType === 'supplier' && type === 'credit') {
      const supplierBalance = await this.financialService.getSupplierBalance(entityId)
      if (supplierBalance.amount < amount) {
        throw new Error('Payment amount exceeds supplier balance')
      }
    }

    // Create entry using domain service
    return await this.financialService.createLedgerEntry({
      entityType,
      entityId,
      type,
      amount: new Money(amount),
      description,
      referenceId
    })
  }

  async recordCustomerCredit(
    customerId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<any> {
    // Delegate to financial service
    return await this.financialService.recordCustomerCredit(
      customerId,
      new Money(amount),
      description,
      referenceId
    )
  }

  async recordCustomerDebit(
    customerId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<any> {
    // Delegate to financial service
    return await this.financialService.recordCustomerDebit(
      customerId,
      new Money(amount),
      description,
      referenceId
    )
  }

  async recordSupplierDebit(
    supplierId: string,
    amount: number,
    description?: string,
    refrenceId?: string
  ): Promise<any> {
    // Delegate to financial service
    return await this.financialService.recordSupplierDebit(
      supplierId,
      new Money(amount),
      description,
      refrenceId
    )
  }

  async recordSupplierCredit(
    supplierId: string,
    amount: number,
    description?: string,
    refrenceId?: string
  ): Promise<any> {
    // Delegate to financial service
    return await this.financialService.recordSupplierCredit(
      supplierId,
      new Money(amount),
      description,
      refrenceId
    )
  }

  async getCustomerBalance(customerId: string): Promise<number> {
    return (await this.financialService.getCustomerBalance(customerId)).amount
  }

  async getSupplierBalance(supplierId: string): Promise<number> {
    return (await this.financialService.getSupplierBalance(supplierId)).amount
  }

  async getCustomerLedgerEntries(
    customerId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return await this.ledgerRepository.findByEntity('customer', customerId, pagination)
  }

  async getSupplierLedgerEntries(
    supplierId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return await this.ledgerRepository.findByEntity('supplier', supplierId, pagination)
  }

  async getLedgerEntriesByTenant(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return await this.ledgerRepository.findByTenantId(pagination)
  }

  async getLedgerEntriesByDateRange(
    startDate: Date,
    endDate: Date,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return await this.ledgerRepository.findByDateRange(startDate, endDate, pagination)
  }

  async generateFinancialReport(
    period: FinancialPeriod
  ): Promise<FinancialReport> {
    const ledgerEntries = await this.getLedgerEntriesByDateRange(period.startDate, period.endDate, { page: 1, limit: 10000 })
    
    // Delegate complex financial reporting to domain service
    return await this.financialService.generateFinancialReport(ledgerEntries, period)
  }

  async calculateMetrics(
    period: FinancialPeriod
  ): Promise<any> {
    const ledgerEntries = await this.getLedgerEntriesByDateRange(period.startDate, period.endDate, { page: 1, limit: 10000 })
    
    // Delegate complex calculations to domain service
    return await this.financialService.calculateMetrics(ledgerEntries, period)
  }

  async getLedgerEntryById(id: string): Promise<any> {
    return await this.ledgerRepository.findById(id)
  }
}