export class InventoryMovement {
  private readonly _id: string
  private readonly _tenantId: string
  private readonly _productId: string
  private readonly _type: 'in' | 'out' | 'adjustment'
  private readonly _quantity: number
  private readonly _reason?: string
  private readonly _referenceId?: string
  private readonly _createdAt: Date

  constructor(data: {
    id: string
    tenantId: string
    productId: string
    type: 'in' | 'out' | 'adjustment'
    quantity: number
    reason?: string
    referenceId?: string
    createdAt: Date
  }) {
    this._id = data.id
    this._tenantId = data.tenantId
    this._productId = data.productId
    this._type = data.type
    this._quantity = data.quantity
    this._reason = data.reason
    this._referenceId = data.referenceId
    this._createdAt = data.createdAt
  }

  get id(): string {
    return this._id
  }

  get tenantId(): string {
    return this._tenantId
  }

  get productId(): string {
    return this._productId
  }

  get type(): 'in' | 'out' | 'adjustment' {
    return this._type
  }

  get quantity(): number {
    return this._quantity
  }

  get reason(): string | undefined {
    return this._reason
  }

  get referenceId(): string | undefined {
    return this._referenceId
  }

  get createdAt(): Date {
    return this._createdAt
  }

  static create(
    tenantId: string,
    productId: string,
    type: 'in' | 'out' | 'adjustment',
    quantity: number,
    reason?: string,
    referenceId?: string
  ): {
    tenantId: string
    productId: string
    type: 'in' | 'out' | 'adjustment'
    quantity: number
    reason?: string
    referenceId?: string
  } {
    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }

    if (!productId) {
      throw new Error('Product ID is required')
    }

    if (quantity < 0) {
      throw new Error('Quantity cannot be negative')
    }

    return {
      tenantId,
      productId,
      type,
      quantity,
      reason: reason?.trim() || undefined,
      referenceId
    }
  }

  isStockInflow(): boolean {
    return this._type === 'in'
  }

  isStockOutflow(): boolean {
    return this._type === 'out'
  }

  isAdjustment(): boolean {
    return this._type === 'adjustment'
  }

  getNetStockChange(): number {
    switch (this._type) {
      case 'in':
        return this._quantity
      case 'out':
        return -this._quantity
      case 'adjustment':
        return this._quantity // Could be positive or negative
      default:
        return 0
    }
  }
}