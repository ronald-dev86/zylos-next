import { InventoryMovement, type InventoryMovementData } from '@/core/domain/value-objects/InventoryMovement'
import { IInventoryMovementRepository } from '@/core/services/IInventoryMovementRepository'
import { IProductRepository } from '@/core/services/IProductRepository'
import { ProductIsInStockSpecification, ProductIsLowStockSpecification } from '@/core/domain/specifications/ProductSpecification'
import { StockAddedEvent, StockRemovedEvent } from '@/core/domain/events/InventoryEvents'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class InventoryService {
  constructor(
    private inventoryRepository: IInventoryMovementRepository,
    private productRepository: IProductRepository,
    private eventBus: EventBus = new DefaultEventBus() // Event publishing capability
  ) {}

  async recordMovement(
    productId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason?: string,
    referenceId?: string
  ): Promise<InventoryMovement> {
    // Verify product exists
    const product = await this.productRepository.findById(productId)
    if (!product) {
      throw new Error('Product not found')
    }

    // Use domain specifications for validation
    const productSpec = new ProductIsInStockSpecification(
      await this.inventoryRepository.calculateCurrentStock(productId)
    )

    // For outbound movements, check sufficient stock
    if (type === 'out' && !productSpec.isSatisfiedBy({ 
      quantity, 
      ...product 
    })) {
      throw new Error('Insufficient stock for outbound movement')
    }

    // Create inventory movement
    const movementData: InventoryMovementData = {
      productId,
      type,
      quantity,
      reason: reason?.trim() || undefined,
      referenceId
    }

    const movement = await this.inventoryRepository.create(movementData)
    
    // Publish domain event for inventory changes
    if (type === 'in') {
      this.eventBus.publish(new StockAddedEvent({
        productId,
        productName: product.name,
        quantity: movement.quantity,
        newStockLevel: await this.calculateNewStockLevel(productId, movement.quantity),
        reason: movement.reason,
        referenceId: movement.referenceId
      }))
    } else if (type === 'out') {
      this.eventBus.publish(new StockRemovedEvent({
        productId,
        productName: product.name,
        quantity: movement.quantity,
        newStockLevel: await this.calculateNewStockLevel(productId, -movement.quantity),
        reason: movement.reason,
        referenceId: movement.referenceId
      }))
    }

    return movement
  }

  async stockIntake(
    productId: string,
    quantity: number,
    reason?: string
  ): Promise<InventoryMovement> {
    if (quantity <= 0) {
      throw new Error('Stock intake quantity must be positive')
    }

    return await this.recordMovement(
      productId,
      'in',
      quantity,
      reason || 'Stock intake'
    )
  }

  async stockSale(
    productId: string,
    quantity: number,
    reason?: string,
    referenceId?: string
  ): Promise<InventoryMovement> {
    if (quantity <= 0) {
      throw new Error('Sale quantity must be positive')
    }

    return await this.recordMovement(
      productId,
      'out',
      quantity,
      reason || 'Sale',
      referenceId
    )
  }

  async stockAdjustment(
    productId: string,
    quantity: number,
    reason?: string
  ): Promise<InventoryMovement> {
    return await this.recordMovement(
      productId,
      'adjustment',
      quantity,
      reason || 'Inventory adjustment'
    )
  }

  async getCurrentStock(productId: string): Promise<number> {
    return await this.inventoryRepository.calculateCurrentStock(productId)
  }

  async calculateNewStockLevel(
    productId: string,
    quantityChange: number
  ): Promise<number> {
    const currentStock = await this.getCurrentStock(productId)
    return currentStock + quantityChange
  }

  async checkStockLevels(
    lowStockThreshold: number = 10
  ): Promise<Array<{
    productId: string
    productName?: string
    currentStock: number
    status: 'normal' | 'low' | 'critical'
    alertLevel: 'info' | 'warning' | 'error'
  }>> {
    // In a real implementation, you'd get all products with their current stock
    // For now, we'll return a placeholder
    return []
  }

  private async publishInventoryEvent(
    productId: string,
    eventName: string,
    data: any
  ): Promise<void> {
    // Abstract method for publishing inventory events
    // Could be extended to send notifications, update dashboards, etc.
  }
}