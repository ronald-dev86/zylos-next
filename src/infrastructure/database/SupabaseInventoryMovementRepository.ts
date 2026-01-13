import { IInventoryMovementRepository } from '@/core/services/IInventoryMovementRepository'
import { InventoryMovement } from '@/core/entities/InventoryMovement'
import { BaseRepository } from './BaseRepository'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseInventoryMovementRepository extends BaseRepository<InventoryMovement> implements IInventoryMovementRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  protected mapToEntity(data: any): InventoryMovement {
    return new InventoryMovement({
      id: data.id,
      tenantId: data.tenant_id,
      productId: data.product_id,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      referenceType: data.reference_type,
      referenceId: data.reference_id,
      notes: data.notes,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }

  protected getTableName(): string {
    return 'inventory_movements'
  }

  async create(movement: {
    productId: string
    type: 'in' | 'out'
    quantity: number
    reason?: string
    referenceType?: 'sale' | 'purchase' | 'adjustment'
    referenceId?: string
    notes?: string
  }): Promise<InventoryMovement> {
    const { data, error } = await this.withTenantFilter()
      .from('inventory_movements')
      .insert([{
        product_id: movement.productId,
        type: movement.type,
        quantity: movement.quantity,
        reason: movement.reason,
        reference_type: movement.referenceType,
        reference_id: movement.referenceId,
        notes: movement.notes
      }])
      .select()
      .single()

    if (error) throw new Error(`Failed to create inventory movement: ${error.message}`)
    return this.mapToEntity(data)
  }

  async findById(id: string): Promise<InventoryMovement | null> {
    return await this.findByIdInternal(id)
  }

  async findByProductId(productId: string, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>> {
    const query = this.withTenantFilter()
      .from('inventory_movements')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>> {
    const query = this.withTenantFilter()
      .from('inventory_movements')
      .select('*')
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async findByDateRange(startDate: Date, endDate: Date, pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>> {
    const query = this.withTenantFilter()
      .from('inventory_movements')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async findByReferenceType(referenceType: 'sale' | 'purchase' | 'adjustment', pagination: PaginationParams): Promise<PaginatedResponse<InventoryMovement>> {
    const query = this.withTenantFilter()
      .from('inventory_movements')
      .select('*')
      .eq('reference_type', referenceType)
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }
}