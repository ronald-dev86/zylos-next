import { Money } from '../value-objects/Money'
import { MovementType } from '../enums'
import { InventoryMovement, type InventoryMovementData } from '../value-objects/InventoryMovement'

export interface InventoryAlertEvent implements DomainEvent {
  id: string
  eventType: string = 'InventoryAlert'
  aggregateType: string = 'Product'
  occurredOn: Date
  data: {
    productId: string
    productName?: string
    currentStock: number
    thresholdLevel: 'low' | 'out' | 'critical'
    threshold: number
    reorderPoint: number
  }
  version: number
}

export interface StockAddedEvent implements DomainEvent {
  id: string
  eventType: string = 'StockAdded'
  aggregateType: string = 'Product'
  occurredOn: Date
  data: {
    productId: string
    productName?: string
    quantity: number
    newStockLevel: number
    reason?: string
    referenceId?: string
  }
  version: number
}

export interface StockRemovedEvent implements DomainEvent {
  id: string
  eventType: string = 'StockRemoved'
  aggregateType: string = 'Product'
  occurredOn: Date
  data: {
    productId: string
    productName?: string
    quantity: number
    newStockLevel: number
    reason?: string
    referenceId?: string
  }
  version: number
}

export class InventoryAlert implements InventoryAlertEvent {
  readonly id: string
  readonly eventType: string = 'InventoryAlert'
  readonly aggregateType: string = 'Product'
  readonly occurredOn: Date
  readonly data: {
    productId: string
    productName?: string
    currentStock: number
    thresholdLevel: 'low' | 'out' | 'critical'
    threshold: number
    reorderPoint: number
  }
  readonly version: number = 1

  constructor(data: {
    productId: string
    productName?: string
    currentStock: number
    thresholdLevel: 'low' | 'out' | 'critical'
    threshold: number
    reorderPoint: number
  }) {
    this.id = crypto.randomUUID()
    this.aggregateId = data.productId
    this.occurredOn = new Date()
    this.data = data
  }
}

export class StockAdded implements StockAddedEvent {
  readonly id: string
  readonly eventType: string = 'StockAdded'
  readonly aggregateType: string = 'Product'
  readonly occurredOn: Date
  readonly data: {
    productId: string
    productName?: string
    quantity: number
    newStockLevel: number
    reason?: string
    referenceId?: string
  }
  readonly version: number = 1

  constructor(data: {
    productId: string
    productName?: string
    quantity: number
    newStockLevel: number
    reason?: string
    referenceId?: string
  }) {
    this.id = crypto.randomUUID()
    this.aggregateId = data.productId
    this.occurredOn = new Date()
    this.data = data
  }
}

export class StockRemoved implements StockRemovedEvent {
  readonly id: string
  readonly eventType: string = 'StockRemoved'
  readonly aggregateType: string = 'Product'
  readonly occurredOn: Date
  readonly data: {
    productId: string
    productName?: string
    quantity: number
    newStockLevel: number
    reason?: string
    referenceId?: string
  }
  readonly version: number = 1

  constructor(data: {
    productId: string
    productName?: string
    quantity: number
    newStockLevel: number
    reason?: string
    referenceId?: string
  }) {
    this.id = crypto.randomUUID()
    this.aggregateId = data.productId
    this.occurredOn = new Date()
    this.data = data
  }
}

// Import DomainEvent interface
export interface DomainEvent {
  id: string
  eventType: string
  aggregateId: string
  aggregateType: string
  occurredOn: Date
  data: any
  version: number
}