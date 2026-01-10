import { Supplier } from '../entities/Supplier'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface ISupplierRepository {
  create(supplier: {
    name: string
    email?: string
    phone?: string
    address?: string
  }): Promise<Supplier>
  findById(id: string): Promise<Supplier | null>
  findByEmail(email: string): Promise<Supplier | null>
  findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Supplier>>
  update(id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Supplier>
  delete(id: string): Promise<void>
  searchByName(name: string, pagination: PaginationParams): Promise<PaginatedResponse<Supplier>>
}