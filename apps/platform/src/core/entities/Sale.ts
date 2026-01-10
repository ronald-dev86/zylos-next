export interface SaleLineItem {
  readonly productId: string
  readonly productName?: string
  readonly quantity: number
  readonly unitPrice: number
  readonly totalPrice: number
}

export class Sale {
  private readonly _id: string
  private readonly _tenantId: string
  private readonly _customerId: string
  private readonly _items: SaleLineItem[]
  private readonly _subtotal: number
  private readonly _tax: number
  private readonly _totalAmount: number
  private readonly _status: 'pending' | 'completed' | 'cancelled'
  private readonly _paymentStatus: 'pending' | 'paid' | 'partial'
  private readonly _createdAt: Date
  private readonly _updatedAt: Date

  constructor(data: {
    id: string
    tenantId: string
    customerId: string
    items: SaleLineItem[]
    subtotal: number
    tax: number
    totalAmount: number
    status?: 'pending' | 'completed' | 'cancelled'
    paymentStatus?: 'pending' | 'paid' | 'partial'
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
    this._status = data.status || 'pending'
    this._paymentStatus = data.paymentStatus || 'pending'
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

  get subtotal(): number {
    return this._subtotal
  }

  get tax(): number {
    return this._tax
  }

  get totalAmount(): number {
    return this._totalAmount
  }

  get status(): 'pending' | 'completed' | 'cancelled' {
    return this._status
  }

  get paymentStatus(): 'pending' | 'paid' | 'partial' {
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
    items: Array<{
      productId: string
      productName?: string
      quantity: number
      unitPrice: number
    }>,
    tax?: number
  ): {
    customerId: string
    items: SaleLineItem[]
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

      const totalPrice = item.quantity * item.unitPrice

      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice.toFixed(2)),
        totalPrice: Number(totalPrice.toFixed(2))
      }
    })

    // Calculate totals
    const subtotal = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const taxAmount = tax || 0
    const totalAmount = subtotal + taxAmount

    return {
      customerId,
      items: lineItems,
      tax: taxAmount
    }
  }

  isPending(): boolean {
    return this._status === 'pending'
  }

  isCompleted(): boolean {
    return this._status === 'completed'
  }

  isCancelled(): boolean {
    return this._status === 'cancelled'
  }

  isPaid(): boolean {
    return this._paymentStatus === 'paid'
  }

  isPaymentPending(): boolean {
    return this._paymentStatus === 'pending'
  }

  isPartialPayment(): boolean {
    return this._paymentStatus === 'partial'
  }

  getTotalItems(): number {
    return this._items.reduce((sum, item) => sum + item.quantity, 0)
  }

  formatTotalAmount(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this._totalAmount)
  }

  formatSubtotal(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this._subtotal)
  }

  formatTax(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this._tax)
  }

  canBeCancelled(): boolean {
    return !this.isCancelled() && !this.isPaid()
  }

  requiresPayment(): boolean {
    return !this.isPaid() && this._totalAmount > 0
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
}