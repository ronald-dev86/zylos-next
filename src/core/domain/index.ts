// Domain value objects and enums

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  VENDEDOR = 'vendedor',
  CONTADOR = 'contador'
}

export enum EntityType {
  CUSTOMER = 'customer',
  SUPPLIER = 'supplier'
}

export enum MovementType {
  IN = 'in',
  OUT = 'out',
  ADJUSTMENT = 'adjustment'
}

export enum LedgerType {
  CREDIT = 'credit',
  DEBIT = 'debit'
}

export class Money {
  private readonly _amount: number
  private readonly _currency: string

  constructor(amount: number, currency: string = 'USD') {
    if (amount < 0) {
      throw new Error('Amount cannot be negative')
    }
    this._amount = Number(amount.toFixed(2))
    this._currency = currency
  }

  get amount(): number {
    return this._amount
  }

  get currency(): string {
    return this._currency
  }

  add(other: Money): Money {
    if (this._currency !== other.currency) {
      throw new Error('Cannot add different currencies')
    }
    return new Money(this._amount + other.amount, this._currency)
  }

  subtract(other: Money): Money {
    if (this._currency !== other.currency) {
      throw new Error('Cannot subtract different currencies')
    }
    if (this._amount < other.amount) {
      throw new Error('Insufficient funds')
    }
    return new Money(this._amount - other.amount, this._currency)
  }

  multiply(multiplier: number): Money {
    if (multiplier < 0) {
      throw new Error('Multiplier cannot be negative')
    }
    return new Money(this._amount * multiplier, this._currency)
  }

  format(): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this._currency
    }).format(this._amount)
  }

  toString(): string {
    return `${this._amount} ${this._currency}`
  }
}

export class Email {
  private readonly _value: string

  constructor(email: string) {
    if (!Email.isValid(email)) {
      throw new Error('Invalid email format')
    }
    this._value = email.toLowerCase().trim()
  }

  get value(): string {
    return this._value
  }

  static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  toString(): string {
    return this._value
  }
}

export class Subdomain {
  private readonly _value: string

  constructor(subdomain: string) {
    if (!Subdomain.isValid(subdomain)) {
      throw new Error('Invalid subdomain format')
    }
    this._value = subdomain.toLowerCase().trim()
  }

  get value(): string {
    return this._value
  }

  static isValid(subdomain: string): boolean {
    const subdomainRegex = /^[a-z0-9-]+$/
    return subdomainRegex.test(subdomain) && subdomain.length > 0 && subdomain.length <= 50
  }

  toString(): string {
    return this._value
  }
}

export class SKU {
  private readonly _value: string

  constructor(sku: string) {
    if (!sku || sku.trim().length === 0) {
      throw new Error('SKU cannot be empty')
    }
    this._value = sku.trim().toUpperCase()
  }

  get value(): string {
    return this._value
  }

  toString(): string {
    return this._value
  }
}