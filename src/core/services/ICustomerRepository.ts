import { Customer } from '../entities/Customer'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface ICustomerRepository {
  create(customer: {
    tenantId: string
    name: string
    email?: string
    phone?: string
    address?: string
  }): Promise<Customer>
  findById(id: string, tenantId: string): Promise<Customer | null>
  findByEmail(email: string, tenantId: string): Promise<Customer | null>
  findByTenantId(tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<Customer>>
  update(id: string, tenantId: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer>
  delete(id: string, tenantId: string): Promise<void>
  searchByName(name: string, tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<Customer>>
}