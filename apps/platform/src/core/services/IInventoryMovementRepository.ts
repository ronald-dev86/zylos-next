import { InventoryMovement } from '../entities/InventoryMovement'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface IInventoryMovementRepository {
  create(movement: {
    productId: string
    type: 'in' | 'out' | 'adjustment'
    quantity: number
    reason?: string
    referenceId?: string
  }): Promise<InventoryMovement>
  findById(id: string): Promise<InventoryMovement | null>
  findByProductId(productId: string, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>>
  findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>>
  findByDateRange(startDate: Date, endDate: Date, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>>
  calculateCurrentStock(productId: string): Promise<number>
}