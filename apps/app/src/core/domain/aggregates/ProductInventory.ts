import { Money } from '../value-objects/Money'
import { MovementType } from '../enums'
import { InventoryMovement } from '../value-objects/InventoryMovement'

export interface InventoryMovementData {
  productId: string
  type: MovementType
  quantity: number
  reason?: string
  referenceId?: string
}

export class ProductInventory {
  private readonly _productId: string
  private readonly _productName?: string
  private readonly _currentStock: number
  private readonly _movements: InventoryMovement[]
  private readonly _lastUpdated: Date

  constructor(data: {
    productId: string
    productName?: string
    currentStock: number
    movements: InventoryMovement[]
    lastUpdated: Date
  }) {
    this._productId = data.productId
    this._productName = data.productName
    this._currentStock = data.currentStock
    this._movements = data.movements
    this._lastUpdated = data.lastUpdated
  }

  get productId(): string {
    return this._productId
  }

  get productName(): string | undefined {
    return this._productName
  }

  get currentStock(): number {
    return this._currentStock
  }

  get movements(): InventoryMovement[] {
    return this._movements
  }

  get lastUpdated(): Date {
    return this._lastUpdated
  }

  isInStock(): boolean {
    return this._currentStock > 0
  }

  hasLowStock(threshold: number): boolean {
    return this._currentStock <= threshold
  }

  hasSufficientStock(required: number): boolean {
    return this._currentStock >= required
  }

  getStockValue(unitPrice: Money): Money {
    return unitPrice.multiply(this._currentStock)
  }

  getRecentMovements(days: number = 30): InventoryMovement[] {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return this._movements.filter(movement => 
      movement.createdAt >= cutoffDate
    )
  }

  getTotalIncoming(quantity: number): number {
    return this._currentStock + quantity
  }

  getTotalOutgoing(quantity: number): number {
    return this._currentStock - quantity
  }

  toJSON() {
    return {
      productId: this._productId,
      productName: this._productName,
      currentStock: this._currentStock,
      movements: this._movements.map(movement => movement.toJSON()),
      lastUpdated: this._lastUpdated
    }
  }
}