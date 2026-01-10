import { EmailValidator } from '@/shared/validators/EmailValidator'

export class Customer {
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
    name: string,
    email?: string,
    phone?: string,
    address?: string
  ): {
    name: string
    email?: string
    phone?: string
    address?: string
  } {
    if (!name || name.trim().length === 0) {
      throw new Error('Customer name is required')
    }

    const normalizedEmail = email ? EmailValidator.validateAndNormalize(email) : undefined

    return {
      name: name.trim(),
      email: normalizedEmail,
      phone: phone?.trim() || undefined,
      address: address?.trim() || undefined
    }
  }

  hasValidContactInfo(): boolean {
    return !!(this._email || this._phone)
  }

  getDisplayName(): string {
    return this._name
  }
}