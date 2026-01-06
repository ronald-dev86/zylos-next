import { Supplier } from '../entities/Supplier'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface ISupplierRepository {
  create(supplier: {
    tenantId: string
    name: string
    email?: string
    phone?: string
    address?: string
  }): Promise<Supplier>
  findById(id: string, tenantId: string): Promise<Supplier | null>
  findByEmail(email: string, tenantId: string): Promise<Supplier | null>
  findByTenantId(tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<Supplier>>
  update(id: string, tenantId: string, data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Supplier>
  delete(id: string, tenantId: string): Promise<void>
  searchByName(name: string, tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<Supplier>>
}