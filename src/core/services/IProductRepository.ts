import { Product } from '../entities/Product'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface IProductRepository {
  create(product: {
    tenantId: string
    name: string
    description?: string
    sku: string
    price: number
  }): Promise<Product>
  findById(id: string, tenantId: string): Promise<Product | null>
  findBySku(sku: string, tenantId: string): Promise<Product | null>
  findByTenantId(tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<Product>>
  update(id: string, tenantId: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product>
  delete(id: string, tenantId: string): Promise<void>
  searchByName(name: string, tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<Product>>
}