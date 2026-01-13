export class InventoryMovement {
  public readonly id: string
  public readonly tenantId: string
  public readonly productId: string
  public readonly type: 'in' | 'out'
  public readonly quantity: number
  public readonly reason?: string
  public readonly referenceType?: 'sale' | 'purchase' | 'adjustment'
  public readonly referenceId?: string
  public readonly notes?: string
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(data: {
    id: string
    tenantId: string
    productId: string
    type: 'in' | 'out'
    quantity: number
    reason?: string
    referenceType?: 'sale' | 'purchase' | 'adjustment'
    referenceId?: string
    notes?: string
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = data.id
    this.tenantId = data.tenantId
    this.productId = data.productId
    this.type = data.type
    this.quantity = data.quantity
    this.reason = data.reason
    this.referenceType = data.referenceType
    this.referenceId = data.referenceId
    this.notes = data.notes
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  static create(data: {
    productId: string
    type: 'in' | 'out'
    quantity: number
    reason?: string
    referenceType?: 'sale' | 'purchase' | 'adjustment'
    referenceId?: string
    notes?: string
  }, tenantId: string): Omit<InventoryMovement, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'> {
    return {
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      notes: data.notes
    } as InventoryMovement
  }

  isIncoming(): boolean {
    return this.type === 'in'
  }

  isOutgoing(): boolean {
    return this.type === 'out'
  }
}