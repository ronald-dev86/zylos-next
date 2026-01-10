import { Customer, type CustomerData } from '@/core/entities/Customer'
import { CustomerAggregate } from '@/core/domain/aggregates/Customer'
import { ICustomerRepository } from '@/core/services/ICustomerRepository'
import { ILedgerEntryRepository } from '@/core/services/ILedgerEntryRepository'
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
    // Validate email using domain logic
    if (email) {
      const existingCustomer = await this.customerRepository.findByEmail(email)
      if (existingCustomer) {
        throw new Error('Customer email already exists')
      }
    }

    // Create customer entity
    const customerData: CustomerData = Customer.create(name, email, phone, address)
    const customer = await this.customerRepository.create(customerData)

    // Initialize aggregate for immediate use
    const ledgerEntries = await this.ledgerRepository.findByCustomer(customer.id, { page: 1, limit: 1 })
    return new CustomerAggregate({
      ...customer.toJSON(),
      ledgerEntries: ledgerEntries.data
    })
  }

  async getCustomerById(id: string): Promise<Customer | null> {
    const customer = await this.customerRepository.findById(id)
    if (!customer) return null

    // Return as aggregate for business operations
    const ledgerEntries = await this.ledgerRepository.findByCustomer(id, { page: 1, limit: 100 })
    return new CustomerAggregate({
      ...customer.toJSON(),
      ledgerEntries: ledgerEntries.data
    })
  }

  async getCustomerAggregate(id: string): Promise<CustomerAggregate | null> {
    const customer = await this.customerRepository.findById(id)
    if (!customer) return null

    const ledgerEntries = await this.ledgerRepository.findByCustomer(id, { page: 1, limit: 1000 })
    return new CustomerAggregate({
      ...customer.toJSON(),
      ledgerEntries: ledgerEntries.data
    })
  }

  async getCustomerByEmail(email: string): Promise<Customer | null> {
    return await this.customerRepository.findByEmail(email)
  }

  async getCustomersByTenant(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<CustomerAggregate>> {
    const customers = await this.customerRepository.findByTenantId(pagination)
    
    // Enrich with ledger data for each customer
    const enrichedCustomers = await Promise.all(
      customers.data.map(async (customer) => {
        const ledgerEntries = await this.ledgerRepository.findByCustomer(customer.id, { page: 1, limit: 10 })
        return new CustomerAggregate({
          ...customer.toJSON(),
          ledgerEntries: ledgerEntries.data
        })
      })
    )

    return {
      data: enrichedCustomers,
      pagination: customers.pagination
    }
  }

  async searchCustomers(
    name: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<CustomerAggregate>> {
    const customers = await this.customerRepository.searchByName(name, pagination)
    
    const enrichedCustomers = await Promise.all(
      customers.data.map(async (customer) => {
        const ledgerEntries = await this.ledgerRepository.findByCustomer(customer.id, { page: 1, limit: 10 })
        return new CustomerAggregate({
          ...customer.toJSON(),
          ledgerEntries: ledgerEntries.data
        })
      })
    )

    return {
      data: enrichedCustomers,
      pagination: customers.pagination
    }
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
    // Validate email change if applicable
    if (data.email) {
      const existingCustomer = await this.customerRepository.findByEmail(data.email)
      if (existingCustomer && existingCustomer.id !== id) {
        throw new Error('Customer email already exists')
      }
    }

    const updatedCustomer = await this.customerRepository.update(id, data)
    
    // Return updated aggregate
    return await this.getCustomerAggregate(id)
  }

  async deleteCustomer(id: string): Promise<void> {
    // Check if customer has outstanding balance using aggregate
    const customerAggregate = await this.getCustomerAggregate(id)
    if (customerAggregate && customerAggregate.hasOutstandingBalance()) {
      throw new Error('Cannot delete customer with outstanding balance')
    }

    await this.customerRepository.delete(id)
  }

  async addCreditToCustomer(
    customerId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<CustomerAggregate> {
    const customerAggregate = await this.getCustomerAggregate(customerId)
    if (!customerAggregate) {
      throw new Error('Customer not found')
    }

    // Check credit limit using domain rules
    if (!customerAggregate.canAddCredit(new Money(amount))) {
      throw new Error('Customer credit limit exceeded')
    }

    // Add ledger entry through aggregate
    return await customerAggregate.addCredit(amount, description, referenceId)
  }

  async recordPaymentFromCustomer(
    customerId: string,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<CustomerAggregate> {
    const customerAggregate = await this.getCustomerAggregate(customerId)
    if (!customerAggregate) {
      throw new Error('Customer not found')
    }

    // Check if payment is valid using aggregate
    if (!customerAggregate.canMakePayment(new Money(amount))) {
      throw new Error('Payment amount exceeds customer balance')
    }

    return await customerAggregate.recordPayment(amount, description, referenceId)
  }
}