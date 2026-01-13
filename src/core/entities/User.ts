export class User {
  public readonly id: string
  public readonly email: string
  public readonly tenantId: string
  public readonly role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(data: {
    id: string
    email: string
    tenantId: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = data.id
    this.email = data.email
    this.tenantId = data.tenantId
    this.role = data.role
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  static create(data: {
    email: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  }, tenantId: string): Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'> {
    return {
      email: data.email,
      role: data.role
    } as User
  }

  isAdmin(): boolean {
    return this.role === 'super_admin' || this.role === 'admin'
  }

  canManageUsers(): boolean {
    return this.role === 'super_admin' || this.role === 'admin'
  }

  canManageSales(): boolean {
    return this.role === 'super_admin' || this.role === 'admin' || this.role === 'vendedor'
  }

  canManageFinances(): boolean {
    return this.role === 'super_admin' || this.role === 'admin' || this.role === 'contador'
  }
}