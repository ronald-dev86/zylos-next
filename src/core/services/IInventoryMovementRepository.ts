import { InventoryMovement } from '@/core/entities/InventoryMovement'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface IInventoryMovementRepository {
  create(movement: {
    productId: string
    type: 'in' | 'out'
    quantity: number
    reason?: string
    referenceType?: 'sale' | 'purchase' | 'adjustment'
    referenceId?: string
    notes?: string
  }): Promise<InventoryMovement>
  findById(id: string): Promise<InventoryMovement | null>
  findByProductId(productId: string, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>>
  findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>>
  findByDateRange(startDate: Date, endDate: Date, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>>
  findByReferenceType(referenceType: 'sale' | 'purchase' | 'adjustment', pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>>
}