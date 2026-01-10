import { Money } from '../value-objects/Money'
import { EntityType } from '../enums'
import { LedgerType } from '../enums'

export interface LedgerEntryData {
  entityType: EntityType
  entityId: string
  type: LedgerType
  amount: Money
  description?: string
  referenceId?: string
}

export class LedgerEntry {
  private readonly _id: string
  private readonly _tenantId: string
  private readonly _entityType: EntityType
  private readonly _entityId: string
  private readonly _type: LedgerType
  private readonly _amount: Money
  private readonly _description?: string
  private readonly _referenceId?: string
  private readonly _createdAt: Date

  constructor(data: {
    id: string
    tenantId: string
    entityType: EntityType
    entityId: string
    type: LedgerType
    amount: Money
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

  get entityType(): EntityType {
    return this._entityType
  }

  get entityId(): string {
    return this._entityId
  }

  get type(): LedgerType {
    return this._type
  }

  get amount(): Money {
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

  isCredit(): boolean {
    return this._type === LedgerType.CREDIT
  }

  isDebit(): boolean {
    return this._type === LedgerType.DEBIT
  }

  isCustomerEntry(): boolean {
    return this._entityType === EntityType.CUSTOMER
  }

  isSupplierEntry(): boolean {
    return this._entityType === EntityType.SUPPLIER
  }

  getBalanceImpact(): Money {
    if (this._entityType === EntityType.CUSTOMER) {
      // Customer: credit increases balance, debit decreases balance
      return this.isCredit() ? this._amount : this._amount.multiply(-1)
    } else {
      // Supplier: debit increases balance, credit decreases balance
      return this.isDebit() ? this._amount : this._amount.multiply(-1)
    }
  }

  formatAmount(): string {
    return this._amount.format()
  }

  static create(data: LedgerEntryData): LedgerEntryData {
    if (!data.entityId) {
      throw new Error('Entity ID is required')
    }

    if (data.amount.amount < 0) {
      throw new Error('Amount cannot be negative')
    }

    return {
      entityType: data.entityType,
      entityId: data.entityId,
      type: data.type,
      amount: new Money(data.amount.amount),
      description: data.description?.trim() || undefined,
      referenceId: data.referenceId
    }
  }

  toJSON() {
    return {
      id: this._id,
      tenantId: this._tenantId,
      entityType: this._entityType,
      entityId: this._entityId,
      type: this._type,
      amount: this._amount.amount,
      description: this._description,
      referenceId: this._referenceId,
      createdAt: this._createdAt
    }
  }
}