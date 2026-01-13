export class Tenant {
  public readonly id: string
  public readonly name: string
  public readonly subdomain: string
  public readonly active: boolean
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(data: {
    id: string
    name: string
    subdomain: string
    active: boolean
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = data.id
    this.name = data.name
    this.subdomain = data.subdomain
    this.active = data.active
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  static create(data: {
    name: string
    subdomain: string
  }): Omit<Tenant, 'id' | 'createdAt' | 'updatedAt' | 'active'> {
    return {
      name: data.name,
      subdomain: data.subdomain
    } as Tenant
  }

  isActive(): boolean {
    return this.active
  }

  activate(): Tenant {
    return new Tenant({
      ...this,
      active: true
    })
  }

  deactivate(): Tenant {
    return new Tenant({
      ...this,
      active: false
    })
  }
}