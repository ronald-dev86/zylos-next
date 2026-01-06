import { Customer } from '../entities/Customer'
import { ICustomerRepository } from '../services/ICustomerRepository'
import { ILedgerEntryRepository } from '../services/ILedgerEntryRepository'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class CustomerService {
  constructor(
    private customerRepository: ICustomerRepository,
    private ledgerRepository: ILedgerEntryRepository
  ) {}

  async createCustomer(
    tenantId: string,
    name: string,
    email?: string,
    phone?: string,
    address?: string
  ): Promise<Customer> {
    // Check if email already exists for this tenant
    if (email) {
      const existingCustomer = await this.customerRepository.findByEmail(email, tenantId)
      if (existingCustomer) {
        throw new Error('Customer email already exists')
      }
    }

    const customerData = Customer.create(tenantId, name, email, phone, address)
    return await this.customerRepository.create(customerData)
  }

  async getCustomerById(id: string, tenantId: string): Promise<Customer | null> {
    return await this.customerRepository.findById(id, tenantId)
  }

  async getCustomerByEmail(email: string, tenantId: string): Promise<Customer | null> {
    return await this.customerRepository.findByEmail(email, tenantId)
  }

  async getCustomersByTenant(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Customer>> {
    return await this.customerRepository.findByTenantId(tenantId, pagination)
  }

  async searchCustomers(
    name: string,
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Customer>> {
    return await this.customerRepository.searchByName(name, tenantId, pagination)
  }

  async updateCustomer(
    id: string,
    tenantId: string,
    data: {
      name?: string
      email?: string
      phone?: string
      address?: string
    }
  ): Promise<Customer> {
    // If updating email, check if it already exists
    if (data.email) {
      const existingCustomer = await this.customerRepository.findByEmail(data.email, tenantId)
      if (existingCustomer && existingCustomer.id !== id) {
        throw new Error('Customer email already exists')
      }
    }

    return await this.customerRepository.update(id, tenantId, data)
  }

  async deleteCustomer(id: string, tenantId: string): Promise<void> {
    // Check if customer has ledger entries (outstanding balance)
    const balance = await this.getCustomerBalance(id, tenantId)
    if (balance !== 0) {
      throw new Error('Cannot delete customer with outstanding balance')
    }

    await this.customerRepository.delete(id, tenantId)
  }

  async getCustomerBalance(customerId: string, tenantId: string): Promise<number> {
    return await this.ledgerRepository.calculateEntityBalance(
      'customer',
      customerId,
      tenantId
    )
  }

  async getCustomersWithBalance(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Customer & { balance: number }>> {
    const customers = await this.getCustomersByTenant(tenantId, pagination)
    
    // Add balance information to each customer
    const customersWithBalance = await Promise.all(
      customers.data.map(async (customer) => {
        const balance = await this.getCustomerBalance(customer.id, customer.tenantId)
        return Object.assign(customer, { balance })
      })
    )

    return {
      data: customersWithBalance,
      pagination: customers.pagination
    }
  }

  async getCustomerLedgerEntries(
    customerId: string,
    tenantId: string,
    pagination: PaginationParams
  ) {
    return await this.ledgerRepository.findByEntity(
      'customer',
      customerId,
      tenantId,
      pagination
    )
  }
}