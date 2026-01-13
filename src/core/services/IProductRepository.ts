import { Product } from '@/core/entities/Product'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface IProductRepository {
  create(product: {
    name: string
    description?: string
    sku?: string
    price: number
    cost?: number
    stockQuantity?: number
    category?: string
  }): Promise<Product>
  findById(id: string): Promise<Product | null>
  findBySku(sku: string): Promise<Product | null>
  findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Product>>
  update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<Product>
  updateStock(id: string, quantity: number): Promise<Product>
  delete(id: string): Promise<void>
  searchByName(name: string, pagination: PaginationParams): Promise<PaginatedResponse<Product>>
  findByCategory(category: string, pagination: PaginationParams): Promise<PaginatedResponse<Product>>
  getLowStockProducts(threshold: number): Promise<Product[]>
}