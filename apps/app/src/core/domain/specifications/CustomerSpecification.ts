import { AbstractSpecification } from './Specification'
import { Money } from '../value-objects/Money'

export class CustomerHasSufficientBalanceSpecification extends AbstractSpecification<{ balance: Money }> {
  constructor(private minimumBalance: Money = new Money(0)) {
    super()
  }

  isSatisfiedBy(customer: { balance: Money }): boolean {
    return customer.balance.amount >= this.minimumBalance.amount
  }
}

export class CustomerHasCreditLimitSpecification extends AbstractSpecification<{ balance: Money; creditLimit: Money }> {
  isSatisfiedBy(customer: { balance: Money; creditLimit: Money }): boolean {
    return customer.balance.amount <= customer.creditLimit.amount
  }
}

export class CustomerIsInGoodStandingSpecification extends AbstractSpecification<{ hasOutstandingBalance: boolean; lastPaymentDate?: Date }> {
  constructor(private maxDaysOutstanding: number = 30) {
    super()
  }

  isSatisfiedBy(customer: { hasOutstandingBalance: boolean; lastPaymentDate?: Date }): boolean {
    if (!customer.hasOutstandingBalance) {
      return true
    }

    if (!customer.lastPaymentDate) {
      return false
    }

    const daysSinceLastPayment = Math.floor(
      (Date.now() - customer.lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    return daysSinceLastPayment <= this.maxDaysOutstanding
  }
}

export class CustomerHasValidEmailSpecification extends AbstractSpecification<{ email: string }> {
  isSatisfiedBy(customer: { email: string }): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(customer.email) && customer.email.trim().length > 0
  }
}

export class CustomerHasValidContactInfoSpecification extends AbstractSpecification<{ email?: string; phone?: string }> {
  isSatisfiedBy(customer: { email?: string; phone?: string }): boolean {
    const hasEmail = customer.email && customer.email.trim().length > 0
    const hasPhone = customer.phone && customer.phone.trim().length > 0
    return hasEmail || hasPhone
  }
}