import { IInventoryMovementRepository } from '@/core/services/IInventoryMovementRepository'
import { InventoryMovement } from '@/core/entities/InventoryMovement'
import { BaseService } from './BaseService'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseInventoryMovementRepository extends BaseService implements IInventoryMovementRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  async create(movement: {
    productId: string
    type: 'in' | 'out' | 'adjustment'
    quantity: number
    reason?: string
    referenceId?: string
  }): Promise<InventoryMovement> {
    // Use RPC function for atomic stock calculation and movement creation
    const result = await this.rpc<{ id: string; created_at: string }>('create_inventory_movement', {
      p_product_id: movement.productId,
      p_type: movement.type,
      p_quantity: movement.quantity,
      p_reason: movement.reason,
      p_reference_id: movement.referenceId
    })

    return new InventoryMovement({
      id: result.id,
      tenantId: this.tenantId!,
      productId: movement.productId,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      referenceId: movement.referenceId,
      createdAt: new Date(result.created_at)
    })
  }

  async findById(id: string): Promise<InventoryMovement | null> {
    const { data, error } = await this.withTenantFilter()
      .from('inventory_movements')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (error) throw new Error(`Failed to find inventory movement: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToInventoryMovement(data[0])
  }

  async findByProductId(productId: string, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('inventory_movements')
      .select('*', { count: 'exact' })
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find movements by product: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToInventoryMovement),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('inventory_movements')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find movements by tenant: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToInventoryMovement),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async findByDateRange(startDate: Date, endDate: Date, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('inventory_movements')
      .select('*', { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find movements by date range: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToInventoryMovement),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async calculateCurrentStock(productId: string): Promise<number> {
    const result = await this.rpc<{ stock: number }>('calculate_current_stock', {
      p_product_id: productId
    })

    return result.stock
  }

  private mapToInventoryMovement(data: Database['public']['Tables']['inventory_movements']['Row']): InventoryMovement {
    return new InventoryMovement({
      id: data.id,
      tenantId: data.tenant_id,
      productId: data.product_id,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      referenceId: data.reference_id,
      createdAt: new Date(data.created_at)
    })
  }
}