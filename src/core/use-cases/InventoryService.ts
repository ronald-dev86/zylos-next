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
    tenantId: string,
    productId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason?: string,
    referenceId?: string
  ): Promise<InventoryMovement> {
    // Verify product exists and belongs to tenant
    const product = await this.productRepository.findById(productId, tenantId)
    if (!product) {
      throw new Error('Product not found')
    }

    // For outbound movements, check if there's sufficient stock
    if (type === 'out') {
      const currentStock = await this.inventoryRepository.calculateCurrentStock(
        productId,
        tenantId
      )
      if (currentStock < quantity) {
        throw new Error(
          `Insufficient stock. Current: ${currentStock}, Required: ${quantity}`
        )
      }
    }

    const movementData = InventoryMovement.create(
      tenantId,
      productId,
      type,
      quantity,
      reason,
      referenceId
    )

    return await this.inventoryRepository.create(movementData)
  }

  async stockIntake(
    tenantId: string,
    productId: string,
    quantity: number,
    reason?: string
  ): Promise<InventoryMovement> {
    if (quantity <= 0) {
      throw new Error('Stock intake quantity must be positive')
    }

    return await this.recordMovement(
      tenantId,
      productId,
      'in',
      quantity,
      reason || 'Stock intake'
    )
  }

  async stockSale(
    tenantId: string,
    productId: string,
    quantity: number,
    reason?: string,
    referenceId?: string
  ): Promise<InventoryMovement> {
    if (quantity <= 0) {
      throw new Error('Sale quantity must be positive')
    }

    return await this.recordMovement(
      tenantId,
      productId,
      'out',
      quantity,
      reason || 'Sale',
      referenceId
    )
  }

  async stockAdjustment(
    tenantId: string,
    productId: string,
    quantity: number,
    reason?: string
  ): Promise<InventoryMovement> {
    return await this.recordMovement(
      tenantId,
      productId,
      'adjustment',
      quantity,
      reason || 'Inventory adjustment'
    )
  }

  async getMovementsByProduct(
    productId: string,
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<InventoryMovement>> {
    return await this.inventoryRepository.findByProductId(
      productId,
      tenantId,
      pagination
    )
  }

  async getMovementsByTenant(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<InventoryMovement>> {
    return await this.inventoryRepository.findByTenantId(tenantId, pagination)
  }

  async getMovementsByDateRange(
    startDate: Date,
    endDate: Date,
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<InventoryMovement>> {
    return await this.inventoryRepository.findByDateRange(
      startDate,
      endDate,
      tenantId,
      pagination
    )
  }

  async getCurrentStock(productId: string, tenantId: string): Promise<number> {
    return await this.inventoryRepository.calculateCurrentStock(productId, tenantId)
  }

  async getMovementById(
    id: string,
    tenantId: string
  ): Promise<InventoryMovement | null> {
    return await this.inventoryRepository.findById(id, tenantId)
  }
}