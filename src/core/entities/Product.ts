export class Product {
  public readonly id: string
  public readonly tenantId: string
  public readonly name: string
  public readonly description?: string
  public readonly sku?: string
  public readonly price: number
  public readonly cost?: number
  public readonly stockQuantity: number
  public readonly category?: string
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(data: {
    id: string
    tenantId: string
    name: string
    description?: string
    sku?: string
    price: number
    cost?: number
    stockQuantity: number
    category?: string
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = data.id
    this.tenantId = data.tenantId
    this.name = data.name
    this.description = data.description
    this.sku = data.sku
    this.price = data.price
    this.cost = data.cost
    this.stockQuantity = data.stockQuantity
    this.category = data.category
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  static create(data: {
    name: string
    description?: string
    sku?: string
    price: number
    cost?: number
    stockQuantity?: number
    category?: string
  }, tenantId: string): Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'> {
    return {
      name: data.name,
      description: data.description,
      sku: data.sku,
      price: data.price,
      cost: data.cost,
      stockQuantity: data.stockQuantity || 0,
      category: data.category
    } as Product
  }

  isInStock(): boolean {
    return this.stockQuantity > 0
  }

  updateStock(quantity: number): Product {
    return new Product({
      ...this,
      stockQuantity: Math.max(0, this.stockQuantity + quantity)
    })
  }
}