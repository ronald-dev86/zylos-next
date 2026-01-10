import { Money } from '../value-objects/Money'
import { EntityType } from '../enums'
import { LedgerEntry, type LedgerEntryData } from './Ledger'

export interface CustomerFinancialData {
  totalCredit: Money
  totalDebit: Money
  currentBalance: Money
  totalOrders: number
  averageOrderValue: Money
  lastActivity?: Date
}

export class CustomerAggregate {
  private readonly _id: string
  private readonly _tenantId: string
  private readonly _name: string
  private readonly _email?: string
  private readonly _phone?: string
  private readonly _address?: string
  private readonly _ledgerEntries: LedgerEntry[]
  private readonly _createdAt: Date
  private readonly _updatedAt: Date

  constructor(data: {
    id: string
    tenantId: string
    name: string
    email?: string
    phone?: string
    address?: string
    ledgerEntries: LedgerEntry[]
    createdAt: Date
    updatedAt: Date
  }) {
    this._id = data.id
    this._tenantId = data.tenantId
    this._name = data.name
    this._email = data.email
    this._phone = data.phone
    this._address = data.address
    this._ledgerEntries = data.ledgerEntries
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

  get ledgerEntries(): LedgerEntry[] {
    return this._ledgerEntries
  }

  get createdAt(): Date {
    return this._createdAt
  }

  get updatedAt(): Date {
    return this._updatedAt
  }

  getCurrentBalance(): Money {
    const totalCredit = this._ledgerEntries
      .filter(entry => entry.isCredit())
      .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

    const totalDebit = this._ledgerEntries
      .filter(entry => entry.isDebit())
      .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

    return totalCredit.subtract(totalDebit)
  }

  getTotalDebt(): Money {
    const balance = this.getCurrentBalance()
    return balance.amount > 0 ? balance : new Money(0)
  }

  hasOutstandingBalance(): boolean {
    return this.getCurrentBalance().amount > 0
  }

  canAddCredit(amount: Money): boolean {
    if (amount.amount <= 0) return false
    
    const currentBalance = this.getCurrentBalance()
    const newBalance = currentBalance.add(amount)
    
    // Simple business rule: max credit limit of $10,000
    return newBalance.amount <= 10000
  }

  canMakePayment(amount: Money): boolean {
    if (amount.amount <= 0) return false
    
    const currentBalance = this.getCurrentBalance()
    return currentBalance.amount >= amount.amount
  }

  getFinancialSummary(): CustomerFinancialData {
    const creditEntries = this._ledgerEntries.filter(entry => entry.isCredit())
    const debitEntries = this._ledgerEntries.filter(entry => entry.isDebit())
    
    const totalCredit = creditEntries.reduce((sum, entry) => sum.add(entry.amount), new Money(0))
    const totalDebit = debitEntries.reduce((sum, entry) => sum.add(entry.amount), new Money(0))
    const currentBalance = totalCredit.subtract(totalDebit)
    
    const totalOrders = creditEntries.length
    const averageOrderValue = totalOrders > 0 
      ? totalCredit.divide(totalOrders)
      : new Money(0)
    
    const lastActivity = this._ledgerEntries.length > 0
      ? Math.max(...this._ledgerEntries.map(entry => entry.createdAt))
      : undefined

    return {
      totalCredit,
      totalDebit,
      currentBalance,
      totalOrders,
      averageOrderValue,
      lastActivity
    }
  }

  addLedgerEntry(entryData: LedgerEntryData): CustomerAggregate {
    const newEntry = new LedgerEntry({
      id: crypto.randomUUID(),
      tenantId: this._tenantId,
      entityType: EntityType.CUSTOMER,
      entityId: this._id,
      ...entryData,
      createdAt: new Date()
    })

    return new CustomerAggregate({
      ...this.toJSON(),
      ledgerEntries: [...this._ledgerEntries, newEntry],
      updatedAt: new Date()
    })
  }

  toJSON() {
    return {
      id: this._id,
      tenantId: this._tenantId,
      name: this._name,
      email: this._email,
      phone: this._phone,
      address: this._address,
      ledgerEntries: this._ledgerEntries.map(entry => entry.toJSON()),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    }
  }
}