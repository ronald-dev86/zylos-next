import { InventoryMovement } from '../entities/InventoryMovement'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface IInventoryMovementRepository {
  create(movement: {
    tenantId: string
    productId: string
    type: 'in' | 'out' | 'adjustment'
    quantity: number
    reason?: string
    referenceId?: string
  }): Promise<InventoryMovement>
  findById(id: string, tenantId: string): Promise<InventoryMovement | null>
  findByProductId(productId: string, tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>>
  findByTenantId(tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>>
  findByDateRange(startDate: Date, endDate: Date, tenantId: string, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>>
  calculateCurrentStock(productId: string, tenantId: string): Promise<number>
}