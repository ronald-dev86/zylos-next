import { Money } from '../value-objects/Money'
import { SaleLineItem, type SaleLineItemData } from '../aggregates/Sale'

export interface PricingCalculation {
  subtotal: Money
  tax: Money
  total: Money
  discount: Money
  finalTotal: Money
}

export interface DiscountRule {
  id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  conditions?: {
    minimumQuantity?: number
    minimumAmount?: Money
    customerType?: string[]
  }
}

export interface TaxRule {
  id: string
  name: string
  type: 'percentage' | 'fixed'
  value: number
  applicableTo?: string[] // Product category IDs
}

export class PricingService {
  private readonly _discountRules: DiscountRule[]
  private readonly _taxRules: TaxRule[]

  constructor(discountRules: DiscountRule[] = [], taxRules: TaxRule[] = []) {
    this._discountRules = discountRules
    this._taxRules = taxRules
  }

  calculateSubtotal(items: SaleLineItemData[]): Money {
    return items.reduce((total, item) => {
      const itemTotal = new Money(item.quantity * item.unitPrice)
      return total.add(itemTotal)
    }, new Money(0))
  }

  calculateDiscount(subtotal: Money, customerId?: string, items: SaleLineItemData[]): Money {
    if (this._discountRules.length === 0) {
      return new Money(0)
    }

    let bestDiscount = new Money(0)

    for (const rule of this._discountRules) {
      const applicableDiscount = this.getApplicableDiscount(rule, subtotal, customerId, items)
      if (applicableDiscount.amount > bestDiscount.amount) {
        bestDiscount = applicableDiscount
      }
    }

    return bestDiscount
  }

  private getApplicableDiscount(
    rule: DiscountRule,
    subtotal: Money,
    customerId?: string,
    items: SaleLineItemData[]
  ): Money {
    // Check minimum quantity condition
    if (rule.conditions?.minimumQuantity) {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
      if (totalQuantity < rule.conditions.minimumQuantity) {
        return new Money(0)
      }
    }

    // Check minimum amount condition
    if (rule.conditions?.minimumAmount) {
      if (subtotal.amount < rule.conditions.minimumAmount.amount) {
        return new Money(0)
      }
    }

    // Calculate discount amount
    if (rule.type === 'percentage') {
      return subtotal.multiply(rule.value / 100)
    } else {
      return new Money(rule.value)
    }
  }

  calculateTax(subtotal: Money, discount: Money, items: SaleLineItemData[]): Money {
    const discountedSubtotal = subtotal.subtract(discount)
    let totalTax = new Money(0)

    for (const rule of this._taxRules) {
      if (this.isTaxRuleApplicable(rule, items)) {
        if (rule.type === 'percentage') {
          totalTax = totalTax.add(discountedSubtotal.multiply(rule.value / 100))
        } else {
          totalTax = totalTax.add(new Money(rule.value))
        }
      }
    }

    return totalTax
  }

  private isTaxRuleApplicable(rule: TaxRule, items: SaleLineItemData[]): boolean {
    if (!rule.applicableTo) {
      return true // Applies to all items
    }

    // Simplified logic - in real implementation, you'd check product categories
    return items.some(item => rule.applicableTo!.includes(item.productId))
  }

  calculateTotal(items: SaleLineItemData[], customerId?: string): PricingCalculation {
    const subtotal = this.calculateSubtotal(items)
    const discount = this.calculateDiscount(subtotal, customerId, items)
    const discountedSubtotal = subtotal.subtract(discount)
    const tax = this.calculateTax(discountedSubtotal, discount, items)
    const total = discountedSubtotal.add(tax)
    const finalTotal = total.subtract(discount)

    return {
      subtotal,
      tax,
      total,
      discount,
      finalTotal
    }
  }

  addDiscountRule(rule: DiscountRule): void {
    this._discountRules.push(rule)
  }

  addTaxRule(rule: TaxRule): void {
    this._taxRules.push(rule)
  }

  removeDiscountRule(ruleId: string): boolean {
    const index = this._discountRules.findIndex(rule => rule.id === ruleId)
    if (index >= 0) {
      this._discountRules.splice(index, 1)
      return true
    }
    return false
  }

  removeTaxRule(ruleId: string): boolean {
    const index = this._taxRules.findIndex(rule => rule.id === ruleId)
    if (index >= 0) {
      this._taxRules.splice(index, 1)
      return true
    }
    return false
  }

  getDiscountRules(): DiscountRule[] {
    return [...this._discountRules]
  }

  getTaxRules(): TaxRule[] {
    return [...this._taxRules]
  }

  applyDiscountCode(
    code: string,
    subtotal: Money,
    items: SaleLineItemData[]
  ): Money {
    // In a real implementation, you'd look up discount codes
    // For now, we'll simulate a few common codes
    const discountCodes: Record<string, { type: 'percentage' | 'fixed'; value: number }> = {
      'SAVE10': { type: 'percentage', value: 10 },
      'SAVE20': { type: 'percentage', value: 20 },
      'FLAT5': { type: 'fixed', value: 5 }
    }

    const discountRule = discountCodes[code.toUpperCase()]
    if (!discountRule) {
      return new Money(0)
    }

    if (discountRule.type === 'percentage') {
      return subtotal.multiply(discountRule.value / 100)
    } else {
      return new Money(discountRule.value)
    }
  }
}