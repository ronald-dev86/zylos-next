import { Money } from '../value-objects/Money'
import { SaleStatus, PaymentStatus } from '../enums'
import { SaleLineItem } from './SaleLineItem'

export interface SaleLineItemData {
  productId: string
  productName?: string
  quantity: number
  unitPrice: number
}

export class Sale {
  private readonly _id: string
  private readonly _tenantId: string
  private readonly _customerId: string
  private readonly _items: SaleLineItem[]
  private readonly _subtotal: Money
  private readonly _tax: Money
  private readonly _totalAmount: Money
  private readonly _status: SaleStatus
  private readonly _paymentStatus: PaymentStatus
  private readonly _createdAt: Date
  private readonly _updatedAt: Date

  constructor(data: {
    id: string
    tenantId: string
    customerId: string
    items: SaleLineItem[]
    subtotal: Money
    tax: Money
    totalAmount: Money
    status?: SaleStatus
    paymentStatus?: PaymentStatus
    createdAt: Date
    updatedAt?: Date
  }) {
    this._id = data.id
    this._tenantId = data.tenantId
    this._customerId = data.customerId
    this._items = data.items
    this._subtotal = data.subtotal
    this._tax = data.tax
    this._totalAmount = data.totalAmount
    this._status = data.status || SaleStatus.PENDING
    this._paymentStatus = data.paymentStatus || PaymentStatus.PENDING
    this._createdAt = data.createdAt
    this._updatedAt = data.updatedAt || data.createdAt
  }

  get id(): string {
    return this._id
  }

  get tenantId(): string {
    return this._tenantId
  }

  get customerId(): string {
    return this._customerId
  }

  get items(): SaleLineItem[] {
    return this._items
  }

  get subtotal(): Money {
    return this._subtotal
  }

  get tax(): Money {
    return this._tax
  }

  get totalAmount(): Money {
    return this._totalAmount
  }

  get status(): SaleStatus {
    return this._status
  }

  get paymentStatus(): PaymentStatus {
    return this._paymentStatus
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  static create(
    customerId: string,
    items: SaleLineItemData[],
    tax?: number
  ): {
    customerId: string
    items: SaleLineItemData[]
    tax?: number
  } {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }

    if (!items || items.length === 0) {
      throw new Error('Sale items are required')
    }

    // Validate and create line items
    const lineItems: SaleLineItem[] = items.map(item => {
      if (item.quantity <= 0) {
        throw new Error('Item quantity must be positive')
      }

      if (item.unitPrice < 0) {
        throw new Error('Item unit price cannot be negative')
      }

      return new SaleLineItem({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: new Money(item.unitPrice)
      })
    })

    return {
      customerId,
      items: lineItems.map(item => item.toJSON()),
      tax
    }
  }

  isPending(): boolean {
    return this._status === SaleStatus.PENDING
  }

  isCompleted(): boolean {
    return this._status === SaleStatus.COMPLETED
  }

  isCancelled(): boolean {
    return this._status === SaleStatus.CANCELLED
  }

  isPaid(): boolean {
    return this._paymentStatus === PaymentStatus.PAID
  }

  isPaymentPending(): boolean {
    return this._paymentStatus === PaymentStatus.PENDING
  }

  isPartialPayment(): boolean {
    return this._paymentStatus === PaymentStatus.PARTIAL
  }

  getTotalItems(): number {
    return this._items.reduce((sum, item) => sum + item.quantity, 0)
  }

  getTotalRevenue(): Money {
    return this._totalAmount
  }

  canBeCancelled(): boolean {
    return !this.isCancelled() && !this.isPaid()
  }

  requiresPayment(): boolean {
    return !this.isPaid() && this._totalAmount.amount > 0
  }

  getItemsSummary(): string {
    const itemCount = this._items.length
    const firstItem = this._items[0]?.productName || 'Unknown Product'
    
    if (itemCount === 1) {
      return firstItem
    } else if (itemCount <= 3) {
      return this._items.map(item => item.productName || 'Unknown Product').join(', ')
    } else {
      return `${firstItem} +${itemCount - 1} more`
    }
  }

  markAsCompleted(): Sale {
    return new Sale({
      ...this.toJSON(),
      status: SaleStatus.COMPLETED
    })
  }

  markAsCancelled(): Sale {
    return new Sale({
      ...this.toJSON(),
      status: SaleStatus.CANCELLED
    })
  }

  markAsPaid(): Sale {
    return new Sale({
      ...this.toJSON(),
      paymentStatus: PaymentStatus.PAID
    })
  }

  markAsPartialPayment(): Sale {
    return new Sale({
      ...this.toJSON(),
      paymentStatus: PaymentStatus.PARTIAL
    })
  }

  toJSON() {
    return {
      id: this._id,
      tenantId: this._tenantId,
      customerId: this._customerId,
      items: this._items.map(item => item.toJSON()),
      subtotal: this._subtotal,
      tax: this._tax,
      totalAmount: this._totalAmount,
      status: this._status,
      paymentStatus: this._paymentStatus,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }
}