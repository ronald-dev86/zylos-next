export class Customer {
  public readonly id: string
  public readonly tenantId: string
  public readonly name: string
  public readonly email?: string
  public readonly phone?: string
  public readonly address?: string
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(data: {
    id: string
    tenantId: string
    name: string
    email?: string
    phone?: string
    address?: string
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = data.id
    this.tenantId = data.tenantId
    this.name = data.name
    this.email = data.email
    this.phone = data.phone
    this.address = data.address
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  static create(data: {
    name: string
    email?: string
    phone?: string
    address?: string
  }, tenantId: string): Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'> {
    return {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address
    } as Customer
  }
}