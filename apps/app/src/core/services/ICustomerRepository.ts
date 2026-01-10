import { Customer } from '../entities/Customer'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface ICustomerRepository {
  create(customer: {
    name: string
    email?: string
    phone?: string
    address?: string
  }): Promise<Customer>
  findById(id: string): Promise<Customer | null>
  findByEmail(email: string): Promise<Customer | null>
  findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Customer>>
  update(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer>
  delete(id: string): Promise<void>
  searchByName(name: string, pagination: PaginationParams): Promise<PaginatedResponse<Customer>>
}