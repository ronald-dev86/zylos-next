import { AuthUser } from '@/shared/types/common'
import { EmailValidator } from '@/shared/validators/EmailValidator'

export class User {
  private readonly _id: string
  private readonly _email: string
  private readonly _tenantId: string
  private readonly _role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  private readonly _createdAt: Date
  private readonly _updatedAt: Date

  constructor(data: {
    id: string
    email: string
    tenantId: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
    createdAt: Date
    updatedAt: Date
  }) {
    this._id = data.id
    this._email = data.email
    this._tenantId = data.tenantId
    this._role = data.role
    this._createdAt = data.createdAt
    this._updatedAt = data.updatedAt
  }

  get id(): string {
    return this._id
  }

  get email(): string {
    return this._email
  }

  get tenantId(): string {
    return this._tenantId
  }

  get role(): 'super_admin' | 'admin' | 'vendedor' | 'contador' {
    return this._role
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  toAuthUser(): AuthUser {
    return {
      id: this._id,
      email: this._email,
      tenant_id: this._tenantId,
      role: this._role
    }
  }

  static create(
    email: string, 
    tenantId: string, 
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  ): {
    email: string
    tenantId: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  } {
if (!email || !EmailValidator.isValid(email)) {
      throw new Error('Valid email is required')
    }

    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }

    return {
      email: EmailValidator.normalize(email),
      tenantId,
      role
    }
  }

  hasPermission(permission: string): boolean {
    const permissions = {
      'super_admin': ['read', 'write', 'delete', 'admin'],
      'admin': ['read', 'write', 'delete'],
      'vendedor': ['read', 'write'],
      'contador': ['read', 'write']
    }
    
    return permissions[this._role]?.includes(permission) || false
  }
}