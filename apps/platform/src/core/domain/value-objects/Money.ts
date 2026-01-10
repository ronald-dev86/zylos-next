// Money Value Object - Domain primitive for monetary values
// Immutable value object with proper arithmetic operations

export class Money {
  private readonly _amount: number

  constructor(amount: number) {
    this._amount = this.validateAmount(amount)
  }

  private validateAmount(amount: number): number {
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number')
    }
    
    if (amount < 0) {
      throw new Error('Amount cannot be negative')
    }
    
    // Round to 2 decimal places for monetary precision
    return Math.round(amount * 100) / 100
  }

  get amount(): number {
    return this._amount
  }

  // Factory methods
  static fromCents(cents: number): Money {
    return new Money(cents / 100)
  }

  static fromString(amountStr: string): Money {
    const parsed = parseFloat(amountStr.replace(/[^0-9.-]/g, ''))
    if (isNaN(parsed)) {
      throw new Error(`Invalid monetary string: ${amountStr}`)
    }
    return new Money(parsed)
  }

  static zero(): Money {
    return new Money(0)
  }

  // Arithmetic operations (return new Money instances - immutable)
  add(other: Money): Money {
    return new Money(this._amount + other._amount)
  }

  subtract(other: Money): Money {
    const result = this._amount - other._amount
    if (result < 0) {
      throw new Error('Cannot subtract more than available amount')
    }
    return new Money(result)
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Multiplication factor cannot be negative')
    }
    return new Money(this._amount * factor)
  }

  divide(divisor: number): Money {
    if (divisor <= 0) {
      throw new Error('Divisor must be positive')
    }
    return new Money(this._amount / divisor)
  }

  // Percentage operations
  percentage(percentage: number): Money {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Percentage must be between 0 and 100')
    }
    return new Money(this._amount * (percentage / 100))
  }

  discount(percentage: number): Money {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Discount percentage must be between 0 and 100')
    }
    return new Money(this._amount * (1 - percentage / 100))
  }

  // Comparison operations
  equals(other: Money): boolean {
    return this._amount === other._amount
  }

  greaterThan(other: Money): boolean {
    return this._amount > other._amount
  }

  greaterThanOrEqual(other: Money): boolean {
    return this._amount >= other._amount
  }

  lessThan(other: Money): boolean {
    return this._amount < other._amount
  }

  lessThanOrEqual(other: Money): boolean {
    return this._amount <= other._amount
  }

  isZero(): boolean {
    return this._amount === 0
  }

  isPositive(): boolean {
    return this._amount > 0
  }

  // Utility methods
  toCents(): number {
    return Math.round(this._amount * 100)
  }

  format(currency: string = '$', locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this._amount)
  }

  toString(): string {
    return this._amount.toFixed(2)
  }

  toJSON(): { amount: number; formatted: string } {
    return {
      amount: this._amount,
      formatted: this.format()
    }
  }

  // Static utility methods
  static sum(moneys: Money[]): Money {
    return moneys.reduce((total, money) => total.add(money), Money.zero())
  }

  static average(moneys: Money[]): Money {
    if (moneys.length === 0) {
      throw new Error('Cannot calculate average of empty array')
    }
    const total = Money.sum(moneys)
    return total.divide(moneys.length)
  }

  static max(moneys: Money[]): Money {
    if (moneys.length === 0) {
      throw new Error('Cannot find max of empty array')
    }
    return moneys.reduce((max, money) => money.greaterThan(max) ? money : max)
  }

  static min(moneys: Money[]): Money {
    if (moneys.length === 0) {
      throw new Error('Cannot find min of empty array')
    }
    return moneys.reduce((min, money) => money.lessThan(min) ? money : min)
  }
}