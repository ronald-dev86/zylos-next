import { Money } from '../value-objects/Money'
import { SaleStatus, PaymentStatus } from '../enums'

export interface DomainEvent {
  id: string
  eventType: string
  aggregateId: string
  aggregateType: string
  occurredOn: Date
  data: any
  version: number
}

export class SaleCreatedEvent implements DomainEvent {
  readonly id: string
  readonly eventType: string = 'SaleCreated'
  readonly aggregateType: string = 'Sale'
  readonly occurredOn: Date
  readonly data: {
    saleId: string
    customerId: string
    totalAmount: Money
    items: Array<{
      productId: string
      productName?: string
      quantity: number
      unitPrice: Money
    }>
    status: SaleStatus
    paymentStatus: PaymentStatus
  }
  readonly version: number = 1

  constructor(data: {
    saleId: string
    customerId: string
    totalAmount: Money
    items: Array<{
      productId: string
      productName?: string
      quantity: number
      unitPrice: Money
    }>
    status: SaleStatus
    paymentStatus: PaymentStatus
  }) {
    this.id = crypto.randomUUID()
    this.aggregateId = data.saleId
    this.occurredOn = new Date()
    this.data = {
      ...data,
      status,
      paymentStatus
    }
  }
}

export class SaleCompletedEvent implements DomainEvent {
  readonly id: string
  readonly eventType: string = 'SaleCompleted'
  readonly aggregateType: string = 'Sale'
  readonly occurredOn: Date
  readonly data: {
    saleId: string
    customerId: string
    totalAmount: Money
    completedAt: Date
  }
  readonly version: number = 1

  constructor(data: {
    saleId: string
    customerId: string
    totalAmount: Money
  }) {
    this.id = crypto.randomUUID()
    this.aggregateId = data.saleId
    this.occurredOn = new Date()
    this.data = {
      ...data,
      completedAt: new Date()
    }
  }
}

export class SaleCancelledEvent implements DomainEvent {
  readonly id: string
  readonly eventType: string = 'SaleCancelled'
  readonly aggregateType: string = 'Sale'
  readonly occurredOn: Date
  readonly data: {
    saleId: string
    customerId: string
    reason?: string
    cancelledAt: Date
  }
  readonly version: number = 1

  constructor(data: {
    saleId: string
    customerId: string
    reason?: string
  }) {
    this.id = crypto.randomUUID()
    this.aggregateId = data.saleId
    this.occurredOn = new Date()
    this.data = {
      ...data,
      cancelledAt: new Date()
    }
  }
}

export class PaymentReceivedEvent implements DomainEvent {
  readonly id: string
  readonly eventType: string = 'PaymentReceived'
  readonly aggregateType: string = 'Sale'
  readonly occurredOn: Date
  readonly data: {
    saleId: string
    customerId: string
    amount: Money
    paymentMethod?: string
    remainingBalance: Money
    paidAt: Date
  }
  readonly version: number = 1

  constructor(data: {
    saleId: string
    customerId: string
    amount: Money
    paymentMethod?: string
    remainingBalance?: Money
  }) {
    this.id = crypto.randomUUID()
    this.aggregateId = data.saleId
    this.occurredOn = new Date()
    this.data = {
      ...data,
      paidAt: new Date(),
      remainingBalance: data.remainingBalance || new Money(0)
    }
  }
}