import { Sale } from '@/infrastructure/database/SupabaseSaleRepository'

export class SalesService {
  static calculateSaleTotal(items: Array<{
    quantity: number
    unitPrice: number
  }>, taxRate: number = 0.16): {
    subtotal: number
    tax: number
    total: number
  } {
    const subtotal = items.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice)
    }, 0)

    const tax = subtotal * taxRate
    const total = subtotal + tax

    return {
      subtotal,
      tax,
      total
    }
  }

  static validateSale(items: Array<{
    productId: string
    quantity: number
    unitPrice: number
  }>): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!items || items.length === 0) {
      errors.push('Sale must have at least one item')
      return { isValid: false, errors }
    }

    items.forEach((item, index) => {
      if (item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`)
      }
      if (item.unitPrice < 0) {
        errors.push(`Item ${index + 1}: Unit price cannot be negative`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static calculateCommission(saleTotal: number, commissionRate: number): number {
    if (commissionRate < 0 || commissionRate > 1) {
      throw new Error('Commission rate must be between 0 and 1')
    }
    return saleTotal * commissionRate
  }
}