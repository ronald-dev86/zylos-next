import { Product } from '@/core/entities/Product'

export class PricingService {
  static calculatePriceWithTax(product: Product, taxRate: number = 0.16): {
    basePrice: number
    tax: number
    totalPrice: number
  } {
    const tax = product.price * taxRate
    const totalPrice = product.price + tax
    
    return {
      basePrice: product.price,
      tax,
      totalPrice
    }
  }

  static applyDiscount(price: number, discountPercentage: number): number {
    if (discountPercentage < 0 || discountPercentage > 100) {
      throw new Error('Discount percentage must be between 0 and 100')
    }
    
    const discountAmount = price * (discountPercentage / 100)
    return price - discountAmount
  }

  static calculateMargin(sellingPrice: number, cost: number): {
    margin: number
    marginPercentage: number
  } {
    const margin = sellingPrice - cost
    const marginPercentage = cost > 0 ? (margin / cost) * 100 : 0
    
    return {
      margin,
      marginPercentage
    }
  }
}