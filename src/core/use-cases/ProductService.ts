import { Product } from '../entities/Product'
import { IProductRepository } from '../services/IProductRepository'
import { IInventoryMovementRepository } from '../services/IInventoryMovementRepository'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class ProductService {
  constructor(
    private productRepository: IProductRepository,
    private inventoryRepository: IInventoryMovementRepository
  ) {}

  async createProduct(
    tenantId: string,
    name: string,
    sku: string,
    price: number,
    description?: string
  ): Promise<Product> {
    // Check if SKU already exists for this tenant
    const existingProduct = await this.productRepository.findBySku(sku, tenantId)
    if (existingProduct) {
      throw new Error('Product SKU already exists')
    }

    const productData = Product.create(tenantId, name, sku, price, description)
    return await this.productRepository.create(productData)
  }

  async getProductById(id: string, tenantId: string): Promise<Product | null> {
    return await this.productRepository.findById(id, tenantId)
  }

  async getProductBySku(sku: string, tenantId: string): Promise<Product | null> {
    return await this.productRepository.findBySku(sku, tenantId)
  }

  async getProductsByTenant(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Product>> {
    return await this.productRepository.findByTenantId(tenantId, pagination)
  }

  async searchProducts(
    name: string,
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Product>> {
    return await this.productRepository.searchByName(name, tenantId, pagination)
  }

  async updateProduct(
    id: string,
    tenantId: string,
    data: {
      name?: string
      description?: string
      price?: number
    }
  ): Promise<Product> {
    // If updating price, ensure it's not negative
    if (data.price !== undefined && data.price < 0) {
      throw new Error('Product price cannot be negative')
    }

    return await this.productRepository.update(id, tenantId, data)
  }

  async deleteProduct(id: string, tenantId: string): Promise<void> {
    // Check if product has inventory movements
    // This would require additional logic to handle product deletion
    await this.productRepository.delete(id, tenantId)
  }

  async getProductStock(productId: string, tenantId: string): Promise<number> {
    return await this.inventoryRepository.calculateCurrentStock(productId, tenantId)
  }

  async getProductsWithStock(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Product & { stock: number }>> {
    const products = await this.getProductsByTenant(tenantId, pagination)
    
    // Add stock information to each product
    const productsWithStock = await Promise.all(
      products.data.map(async (product) => {
        const stock = await this.getProductStock(product.id, product.tenantId)
        return Object.assign(product, { stock })
      })
    )

    return {
      data: productsWithStock,
      pagination: products.pagination
    }
  }
}