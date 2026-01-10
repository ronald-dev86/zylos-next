import { IProductRepository } from '@/core/services/IProductRepository'
import { Product } from '@/core/entities/Product'
import { BaseService } from './BaseService'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseProductRepository extends BaseService implements IProductRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  async create(product: {
    name: string
    description?: string
    sku: string
    price: number
  }): Promise<Product> {
    const { data, error } = await this.withTenantFilter()
      .from('products')
      .insert([{
        name: product.name,
        description: product.description,
        sku: product.sku,
        price: product.price
      }])
      .select()

    if (error) throw new Error(`Failed to create product: ${error.message}`)
    if (!data || data.length === 0) throw new Error('No data returned from product creation')

    return this.mapToProduct(data[0])
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.withTenantFilter()
      .from('products')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (error) throw new Error(`Failed to find product: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToProduct(data[0])
  }

  async findBySku(sku: string): Promise<Product | null> {
    const { data, error } = await this.withTenantFilter()
      .from('products')
      .select('*')
      .eq('sku', sku)
      .limit(1)

    if (error) throw new Error(`Failed to find product by SKU: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToProduct(data[0])
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Product>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find products by tenant: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToProduct),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Product> {
    const updateData = {
      name: data.name,
      description: data.description,
      sku: data.sku,
      price: data.price,
      updated_at: new Date().toISOString()
    }
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const { data: updatedData, error } = await this.withTenantFilter()
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw new Error(`Failed to update product: ${error.message}`)
    if (!updatedData || updatedData.length === 0) throw new Error('No data returned from product update')

    return this.mapToProduct(updatedData[0])
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.withTenantFilter()
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete product: ${error.message}`)
  }

  async searchByName(name: string, pagination: PaginationParams): Promise<PaginatedResponse<Product>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('products')
      .select('*', { count: 'exact' })
      .ilike('name', `%${name}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to search products by name: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToProduct),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  private mapToProduct(data: Database['public']['Tables']['products']['Row']): Product {
    return new Product({
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      description: data.description,
      sku: data.sku,
      price: data.price,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }
}