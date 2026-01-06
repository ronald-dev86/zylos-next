export class LedgerEntry {
  private readonly _id: string
  private readonly _tenantId: string
  private readonly _entityType: 'customer' | 'supplier'
  private readonly _entityId: string
  private readonly _type: 'credit' | 'debit'
  private readonly _amount: number
  private readonly _description?: string
  private readonly _referenceId?: string
  private readonly _createdAt: Date

  constructor(data: {
    id: string
    tenantId: string
    entityType: 'customer' | 'supplier'
    entityId: string
    type: 'credit' | 'debit'
    amount: number
    description?: string
    referenceId?: string
    createdAt: Date
  }) {
    this._id = data.id
    this._tenantId = data.tenantId
    this._entityType = data.entityType
    this._entityId = data.entityId
    this._type = data.type
    this._amount = data.amount
    this._description = data.description
    this._referenceId = data.referenceId
    this._createdAt = data.createdAt
  }

  get id(): string {
    return this._id
  }

  get tenantId(): string {
    return this._tenantId
  }

  get entityType(): 'customer' | 'supplier' {
    return this._entityType
  }

  get entityId(): string {
    return this._entityId
  }

  get type(): 'credit' | 'debit' {
    return this._type
  }

  get amount(): number {
    return this._amount
  }

  get description(): string | undefined {
    return this._description
  }

  get referenceId(): string | undefined {
    return this._referenceId
  }

  get createdAt(): Date {
    return this._createdAt
  }

  static create(
    tenantId: string,
    entityType: 'customer' | 'supplier',
    entityId: string,
    type: 'credit' | 'debit',
    amount: number,
    description?: string,
    referenceId?: string
  ): {
    tenantId: string
    entityType: 'customer' | 'supplier'
    entityId: string
    type: 'credit' | 'debit'
    amount: number
    description?: string
    referenceId?: string
  } {
    if (!tenantId) {
      throw new Error('Tenant ID is required')
    }

    if (!entityId) {
      throw new Error('Entity ID is required')
    }

    if (amount < 0) {
      throw new Error('Amount cannot be negative')
    }

    return {
      tenantId,
      entityType,
      entityId,
      type,
      amount: Number(amount.toFixed(2)),
      description: description?.trim() || undefined,
      referenceId
    }
  }

  isCustomerEntry(): boolean {
    return this._entityType === 'customer'
  }

  isSupplierEntry(): boolean {
    return this._entityType === 'supplier'
  }

  isCredit(): boolean {
    return this._type === 'credit'
  }

  isDebit(): boolean {
    return this._type === 'debit'
  }

  formatAmount(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(this._amount)
  }

  getBalanceImpact(): number {
    if (this._entityType === 'customer') {
      // Customer: credit increases balance (they owe money), debit decreases balance
      return this._type === 'credit' ? this._amount : -this._amount
    } else {
      // Supplier: debit increases balance (we owe money), credit decreases balance
      return this._type === 'debit' ? this._amount : -this._amount
    }
  }
}