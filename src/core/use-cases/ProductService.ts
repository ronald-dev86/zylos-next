import { Product, type ProductData } from '@/core/entities/Product'
import { ProductInventory, type InventoryCalculationReport, type StockAlertLevel } from '@/core/domain/aggregates/ProductInventory'
import { InventoryMovement, type InventoryMovementData } from '@/core/domain/value-objects/InventoryMovement'
import { IProductRepository } from '@/core/services/IProductRepository'
import { IInventoryMovementRepository } from '@/core/services/IInventoryMovementRepository'
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
    // Validate SKU using domain specification
    const existingProduct = await this.productRepository.findBySku(sku)
    if (existingProduct) {
      throw new Error('Product SKU already exists')
    }

    // Create product entity
    const productData: ProductData = Product.create(name, sku, price, description)
    const product = await this.productRepository.create(productData)

    // Initialize inventory with zero stock
    const inventoryMovementData: InventoryMovementData = {
      productId: product.id,
      type: 'adjustment',
      quantity: 0,
      reason: 'Initial stock setup',
      referenceId: product.id
    }

    await this.inventoryRepository.create(inventoryMovementData)
    
    return product
  }

  async getProductById(id: string): Promise<Product | null> {
    const product = await this.productRepository.findById(id)
    if (!product) return null

    // Return as aggregate for inventory operations
    return new ProductInventory({
      ...product.toJSON(),
      currentStock: 0, // Will be updated by movements
      movements: [], // Will be populated by inventory service
      lastUpdated: new Date()
    })
  }

  async getProductWithInventory(id: string): Promise<ProductInventory | null> {
    const product = await this.getProductById(id)
    if (!product) return null

    // Get all inventory movements for this product
    const movements = await this.inventoryRepository.findByProductId(id, { page: 1, limit: 1000 })
    
    // Calculate current stock from movements
    const currentStock = movements.data.reduce((stock, movement) => {
      return stock + movement.getNetStockChange()
    }, 0)

    return new ProductInventory({
      ...product.toJSON(),
      currentStock,
      movements: movements.data,
      lastUpdated: movements.data.length > 0 
        ? Math.max(...movements.data.map(m => m.createdAt))
        : new Date()
    })
  }

  async getProductsByTenant(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<ProductInventory>> {
    const products = await this.productRepository.findByTenantId(pagination)
    
    // Enrich with inventory data for each product
    const enrichedProducts = await Promise.all(
      products.data.map(async (product) => {
        const movements = await this.inventoryRepository.findByProductId(product.id, { page: 1, limit: 50 })
        
        const currentStock = movements.data.reduce((stock, movement) => {
          return stock + movement.getNetStockChange()
        }, 0)

        return new ProductInventory({
          ...product.toJSON(),
          currentStock,
          movements: movements.data,
          lastUpdated: movements.data.length > 0 
            ? Math.max(...movements.data.map(m => m.createdAt))
            : new Date()
        })
      })
    )

    return {
      data: enrichedProducts,
      pagination: products.pagination
    }
  }

  async updateProduct(
    id: string,
    data: {
      name?: string
      description?: string
      price?: number
    }
  ): Promise<ProductInventory> {
    const updatedProduct = await this.productRepository.update(id, data)
    
    // Return as aggregate with updated inventory
    return await this.getProductWithInventory(id)
  }

  async recordInventoryMovement(
    productId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason?: string,
    referenceId?: string
  ): Promise<ProductInventory> {
    // Verify product exists
    const product = await this.productRepository.findById(productId)
    if (!product) {
      throw new Error('Product not found')
    }

    // Use domain inventory calculation service for stock validation
    const currentInventory = await this.getProductWithInventory(productId)
    if (!currentInventory.hasSufficientStock(quantity) && type === 'out') {
      throw new Error(`Insufficient stock. Current: ${currentInventory.currentStock}, Required: ${quantity}`)
    }

    // Create inventory movement
    const movementData: InventoryMovementData = {
      productId,
      type,
      quantity,
      reason: reason || 'Manual adjustment',
      referenceId
    }

    await this.inventoryRepository.create(movementData)
    
    // Return updated product with new inventory state
    return await this.getProductWithInventory(productId)
  }

  async stockIntake(
    productId: string,
    quantity: number,
    reason?: string
  ): Promise<ProductInventory> {
    if (quantity <= 0) {
      throw new Error('Stock intake quantity must be positive')
    }

    return await this.recordInventoryMovement(
      productId,
      'in',
      quantity,
      reason || 'Stock intake',
      undefined
    )
  }

  async stockAdjustment(
    productId: string,
    quantity: number,
    reason?: string
  ): Promise<ProductInventory> {
    return await this.recordInventoryMovement(
      productId,
      'adjustment',
      quantity,
      reason || 'Manual inventory adjustment',
      undefined
    )
  }

  async getInventoryReport(
    lowStockThreshold: number = 10
  ): Promise<InventoryCalculationReport> {
    const products = await this.productRepository.findByTenantId({ page: 1, limit: 1000 })
    
    // Get all inventory movements for stock calculations
    const allMovements = await this.inventoryRepository.findByTenantId({ page: 1, limit: 5000 })
    const movementsByProduct = new Map<string, typeof allMovements.data>()
    
    for (const movement of allMovements.data) {
      const existing = movementsByProduct.get(movement.productId) || []
      existing.push(movement)
      movementsByProduct.set(movement.productId, existing)
    }

    // Generate inventory report using domain calculation service
    const productsWithStock = products.data.map(product => {
      const productMovements = movementsByProduct.get(product.id) || []
      const currentStock = productMovements.reduce((stock, movement) => {
        return stock + movement.getNetStockChange()
      }, 0)

      return {
        productId: product.id,
        productName: product.name,
        currentStock,
        unitPrice: new Money(product.price),
        movements: productMovements
      }
    })

    return new InventoryCalculationService().generateInventoryReport(
      productsWithStock,
      movementsByProduct
    )
  }

  async getLowStockProducts(
    lowStockThreshold: number = 10
  ): Promise<StockAlertLevel[]> {
    const inventoryReport = await this.getInventoryReport(lowStockThreshold)
    
    return inventoryReport.lowStockItems
      .map(alert => ({
        productId: alert.productId,
        productName: alert.productName,
        currentStock: alert.currentStock,
        lowStockThreshold: alert.lowStockThreshold,
        outOfStockThreshold: 0,
        status: alert.status
      }))
      .sort((a, b) => a.currentStock - b.currentStock)
  }

  async optimizeStock(
    maxOrderQuantity: number = 100
  ): Promise<Array<{
    productId: string
    recommendedOrderQuantity: number
    reason: string
  }>> {
    const inventoryReport = await this.getInventoryReport()
    
    const products = inventoryReport.totalProducts > 0 ? inventoryReport.totalValue : []
    const reorderQuantities = new Map<string, number>()
    
    for (const item of inventoryReport.lowStockItems) {
      reorderQuantities.set(item.productId, item.lowStockThreshold)
    }

    const productsForOptimization = inventoryReport.totalProducts > 0 ? products.map(item => ({
      productId: item.productId,
      currentStock: item.currentStock,
      reorderPoint: item.lowStockThreshold || 10,
      maxOrderQuantity
    })) : []

    return new InventoryCalculationService().optimizeReorderQuantities(
      productsForOptimization
    )
  }

  async searchProducts(
    name: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<ProductInventory>> {
    const products = await this.productRepository.searchByName(name, pagination)
    
    const enrichedProducts = await Promise.all(
      products.data.map(product => this.getProductWithInventory(product.id))
    )

    return {
      data: enrichedProducts,
      pagination: products.pagination
    }
  }
}