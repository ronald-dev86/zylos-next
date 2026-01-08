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
    name: string,
    sku: string,
    price: number,
    description?: string
  ): Promise<Product> {
    // Check if SKU already exists
    const existingProduct = await this.productRepository.findBySku(sku)
    if (existingProduct) {
      throw new Error('Product SKU already exists')
    }

    const productData = { name, sku, price, description }
    return await this.productRepository.create(productData)
  }

  async getProductById(id: string): Promise<Product | null> {
    return await this.productRepository.findById(id)
  }

  async getProductBySku(sku: string): Promise<Product | null> {
    return await this.productRepository.findBySku(sku)
  }

  async getProductsByTenant(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Product>> {
    return await this.productRepository.findByTenantId(pagination)
  }

  async searchProducts(
    name: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Product>> {
    return await this.productRepository.searchByName(name, pagination)
  }

  async updateProduct(
    id: string,
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

    return await this.productRepository.update(id, data)
  }

  async deleteProduct(id: string): Promise<void> {
    // Check if product has inventory movements
    // This would require additional logic to handle product deletion
    await this.productRepository.delete(id)
  }

  async getProductStock(productId: string): Promise<number> {
    return await this.inventoryRepository.calculateCurrentStock(productId)
  }

  async getProductsWithStock(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Product & { stock: number }>> {
    const products = await this.getProductsByTenant(pagination)
    
    // Add stock information to each product
    const productsWithStock = await Promise.all(
      products.data.map(async (product) => {
        const stock = await this.getProductStock(product.id)
        return Object.assign(product, { stock })
      })
    )

    return {
      data: productsWithStock,
      pagination: products.pagination
    }
  }
}