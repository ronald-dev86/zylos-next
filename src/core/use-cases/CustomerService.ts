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
    name: string,
    email?: string,
    phone?: string,
    address?: string
  ): Promise<Customer> {
    // Check if email already exists
    if (email) {
      const existingCustomer = await this.customerRepository.findByEmail(email)
      if (existingCustomer) {
        throw new Error('Customer email already exists')
      }
    }

    // Note: Customer.create() still needs tenantId internally
    // We'll need to refactor the entity factory or get tenantId from context
    const customerData = { name, email, phone, address }
    return await this.customerRepository.create(customerData)
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    return await this.customerRepository.findById(id)
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    return await this.customerRepository.findByEmail(email)
  }

  async getCustomersByTenant(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Customer>> {
    return await this.customerRepository.findByTenantId(pagination)
  }

  async searchCustomers(
    name: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Customer>> {
    return await this.customerRepository.searchByName(name, pagination)
  }

  async updateCustomer(
    id: string,
    data: {
      name?: string
      email?: string
      phone?: string
      address?: string
    }
  ): Promise<Customer> {
    // If updating email, check if it already exists
    if (data.email) {
      const existingCustomer = await this.customerRepository.findByEmail(data.email)
      if (existingCustomer && existingCustomer.id !== id) {
        throw new Error('Customer email already exists')
      }
    }

    return await this.customerRepository.update(id, data)
  }

  async deleteCustomer(id: string): Promise<void> {
    // Check if customer has ledger entries (outstanding balance)
    const balance = await this.getCustomerBalance(id)
    if (balance !== 0) {
      throw new Error('Cannot delete customer with outstanding balance')
    }

    await this.customerRepository.delete(id)
  }

  async getCustomerBalance(customerId: string): Promise<number> {
    return await this.ledgerRepository.calculateEntityBalance('customer', customerId)
  }

  async getCustomersWithBalance(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Customer & { balance: number }>> {
    const customers = await this.getCustomersByTenant(pagination)
    
    // Add balance information to each customer
    const customersWithBalance = await Promise.all(
      customers.data.map(async (customer) => {
        const balance = await this.getCustomerBalance(customer.id)
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
    pagination: PaginationParams
  ) {
    return await this.ledgerRepository.findByEntity('customer', customerId, pagination)
  }
}