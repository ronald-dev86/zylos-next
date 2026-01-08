import { InventoryMovement } from '../entities/InventoryMovement'
import { IInventoryMovementRepository } from '../services/IInventoryMovementRepository'
import { IProductRepository } from '../services/IProductRepository'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class InventoryService {
  constructor(
    private inventoryRepository: IInventoryMovementRepository,
    private productRepository: IProductRepository
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

    // For outbound movements, check if there's sufficient stock
    if (type === 'out') {
      const currentStock = await this.inventoryRepository.calculateCurrentStock(productId)
      if (currentStock < quantity) {
        throw new Error(
          `Insufficient stock. Current: ${currentStock}, Required: ${quantity}`
        )
      }
    }

    const movementData = {
      productId,
      type,
      quantity,
      reason,
      referenceId
    }

    return await this.inventoryRepository.create(movementData)
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

  async getMovementsByProduct(
    productId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<InventoryMovement>> {
    return await this.inventoryRepository.findByProductId(productId, pagination)
  }

  async getMovementsByTenant(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<InventoryMovement>> {
    return await this.inventoryRepository.findByTenantId(pagination)
  }

  async getMovementsByDateRange(
    startDate: Date,
    endDate: Date,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<InventoryMovement>> {
    return await this.inventoryRepository.findByDateRange(
      startDate,
      endDate,
      pagination
    )
  }

  async getCurrentStock(productId: string): Promise<number> {
    return await this.inventoryRepository.calculateCurrentStock(productId)
  }

  async getMovementById(id: string): Promise<InventoryMovement | null> {
    return await this.inventoryRepository.findById(id)
  }
}