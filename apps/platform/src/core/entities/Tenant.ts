import { TenantContext } from '@/shared/types/common'

export class Tenant {
  private readonly _id: string
  private readonly _name: string
  private readonly _subdomain: string
  private readonly _createdAt: Date
  private readonly _updatedAt: Date

  constructor(data: {
    id: string
    name: string
    subdomain: string
    createdAt: Date
    updatedAt: Date
  }) {
    this._id = data.id
    this._name = data.name
    this._subdomain = data.subdomain
    this._createdAt = data.createdAt
    this._updatedAt = data.updatedAt
  }

  get id(): string {
    return this._id
  }

  get name(): string {
    return this._name
  }

  get subdomain(): string {
    return this._subdomain
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  toContext(): TenantContext {
    return {
      id: this._id,
      name: this._name,
      subdomain: this._subdomain
    }
  }

  static create(name: string, subdomain: string): {
    name: string
    subdomain: string
  } {
    if (!name || name.trim().length === 0) {
      throw new Error('Tenant name is required')
    }
    
    if (!subdomain || subdomain.trim().length === 0) {
      throw new Error('Tenant subdomain is required')
    }

    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      throw new Error('Subdomain must contain only lowercase letters, numbers, and hyphens')
    }

    return {
      name: name.trim(),
      subdomain: subdomain.trim().toLowerCase()
    }
  }
}