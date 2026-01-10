import { Money } from '../domain/value-objects/Money'

export class SaleLineItem {
  private readonly _productId: string
  private readonly _productName?: string
  private readonly _quantity: number
  private readonly _unitPrice: Money
  private readonly _totalPrice: Money

  constructor(data: {
    productId: string
    productName?: string
    quantity: number
    unitPrice: number | Money
  }) {
    if (data.quantity <= 0) {
      throw new Error('Item quantity must be positive')
    }

    const unitPrice = typeof data.unitPrice === 'number' 
      ? new Money(data.unitPrice)
      : data.unitPrice

    if (unitPrice.amount < 0) {
      throw new Error('Item unit price cannot be negative')
    }

    this._productId = data.productId
    this._productName = data.productName
    this._quantity = data.quantity
    this._unitPrice = unitPrice
    this._totalPrice = unitPrice.multiply(data.quantity)
  }

  get productId(): string {
    return this._productId
  }

  get productName(): string | undefined {
    return this._productName
  }

  get quantity(): number {
    return this._quantity
  }

  get unitPrice(): Money {
    return this._unitPrice
  }

  get totalPrice(): Money {
    return this._totalPrice
  }

  toJSON() {
    return {
      productId: this._productId,
      productName: this._productName,
      quantity: this._quantity,
      unitPrice: this._unitPrice.amount,
      totalPrice: this._totalPrice.amount
    }
  }

  formatUnitPrice(): string {
    return this._unitPrice.format()
  }

  formatTotalPrice(): string {
    return this._totalPrice.format()
  }
}