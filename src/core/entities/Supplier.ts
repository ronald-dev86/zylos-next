export class Supplier {
  private readonly _id: string
  private readonly _tenantId: string
  private readonly _name: string
  private readonly _email?: string
  private readonly _phone?: string
  private readonly _address?: string
  private readonly _createdAt: Date
  private readonly _updatedAt: Date

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
    this._id = data.id
    this._tenantId = data.tenantId
    this._name = data.name
    this._email = data.email
    this._phone = data.phone
    this._address = data.address
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

  get email(): string | undefined {
    return this._email
  }

  get phone(): string | undefined {
    return this._phone
  }

  get address(): string | undefined {
    return this._address
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  static create(
    tenantId: string,
    name: string,
    email?: string,
    phone?: string,
    address?: string
  ): {
    tenantId: string
    name: string
    email?: string
    phone?: string
    address?: string
  } {
    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }

    if (!name || name.trim().length === 0) {
      throw new Error('Supplier name is required')
    }

    if (email && !this.isValidEmail(email)) {
      throw new Error('Invalid email format')
    }

    return {
      tenantId,
      name: name.trim(),
      email: email?.toLowerCase().trim() || undefined,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  hasValidContactInfo(): boolean {
    return !!(this._email || this._phone)
  }

  getDisplayName(): string {
    return this._name
  }
}