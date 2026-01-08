export class Product {
  private readonly _id: string
  private readonly _tenantId: string
  private readonly _name: string
  private readonly _description?: string
  private readonly _sku: string
  private readonly _price: number
  private readonly _createdAt: Date
  private readonly _updatedAt: Date

  constructor(data: {
    id: string
    tenantId: string
    name: string
    description?: string
    sku: string
    price: number
    createdAt: Date
    updatedAt: Date
  }) {
    this._id = data.id
    this._tenantId = data.tenantId
    this._name = data.name
    this._description = data.description
    this._sku = data.sku
    this._price = data.price
    this._createdAt = data.createdAt
    this._updatedAt = data.updatedAt
  }

  get id(): string {
    return this._id
  }

  get tenantId(): string {
    return this._tenantId
  }

  get name(): string {
    return this._name
  }

  get description(): string | undefined {
    return this._description
  }

  get sku(): string {
    return this._sku
  }

  get price(): number {
    return this._price
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

static create(
    name: string,
    sku: string,
    price: number,
    description?: string
  ): {
    name: string
    description?: string
    sku: string
    price: number
  } {
    if (!name || name.trim().length === 0) {
      throw new Error('Product name is required')
    }

    if (!sku || sku.trim().length === 0) {
      throw new Error('Product SKU is required')
    }

    if (price < 0) {
      throw new Error('Product price cannot be negative')
    }

    return {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price: Number(price.toFixed(2)),
      description: description?.trim() || undefined
    }
  }

  formatPrice(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this._price)
  }

  hasStock(stockQuantity: number): boolean {
    return stockQuantity > 0
  }
}