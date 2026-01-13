import { IProductRepository } from '@/core/services/IProductRepository'
import { Product } from '@/core/entities/Product'
import { BaseRepository } from './BaseRepository'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseProductRepository extends BaseRepository<Product> implements IProductRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  protected mapToEntity(data: any): Product {
    return new Product({
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      description: data.description,
      sku: data.sku,
      price: data.price,
      cost: data.cost,
      stockQuantity: data.stock_quantity || 0,
      category: data.category,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }

  protected getTableName(): string {
    return 'products'
  }

  async create(product: {
    name: string
    description?: string
    sku?: string
    price: number
    cost?: number
    stockQuantity?: number
    category?: string
  }): Promise<Product> {
    const { data, error } = await this.withTenantFilter()
      .from('products')
      .insert([{
        name: product.name,
        description: product.description,
        sku: product.sku,
        price: product.price,
        cost: product.cost,
        stock_quantity: product.stockQuantity,
        category: product.category
      }])
      .select()
      .single()

    if (error) throw new Error(`Failed to create product: ${error.message}`)
    return this.mapToEntity(data)
  }

  async findById(id: string): Promise<Product | null> {
    return await this.findByIdInternal(id)
  }

  async findBySku(sku: string): Promise<Product | null> {
    const { data, error } = await this.withTenantFilter()
      .from('products')
      .select('*')
      .eq('sku', sku)
      .limit(1)

    if (error) throw new Error(`Failed to find product by SKU: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToEntity(data[0])
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Product>> {
    const query = this.withTenantFilter()
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async update(id: string, data: Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<Product> {
    const { data: updatedData, error } = await this.withTenantFilter()
      .from('products')
      .update({
        name: data.name,
        description: data.description,
        sku: data.sku,
        price: data.price,
        cost: data.cost,
        stock_quantity: data.stockQuantity,
        category: data.category,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update product: ${error.message}`)
    return this.mapToEntity(updatedData)
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    const { data, error } = await this.supabase
      .from('products')
      .update({ 
        stock_quantity: quantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update product stock: ${error.message}`)
    return this.mapToEntity(data)
  }

  async delete(id: string): Promise<void> {
    await this.deleteInternal(id)
  }

  async searchByName(name: string, pagination: PaginationParams): Promise<PaginatedResponse<Product>> {
    return await this.searchByNameInternal(name, pagination)
  }

  async findByCategory(category: string, pagination: PaginationParams): Promise<PaginatedResponse<Product>> {
    const query = this.supabase
      .from('products')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .eq('category', category)
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async getLowStockProducts(threshold: number): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .lt('stock_quantity', threshold)
      .order('stock_quantity', { ascending: true })

    if (error) throw new Error(`Failed to get low stock products: ${error.message}`)
    return data.map(item => this.mapToEntity(item))
  }
}