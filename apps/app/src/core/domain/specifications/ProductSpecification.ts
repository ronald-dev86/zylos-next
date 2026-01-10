import { AbstractSpecification } from './Specification'
import { Money } from '../value-objects/Money'

export class ProductIsActiveSpecification extends AbstractSpecification<{ status: string }> {
  isSatisfiedBy(product: { status: string }): boolean {
    return product.status === 'active'
  }
}

export class ProductHasSufficientStockSpecification extends AbstractSpecification<{ currentStock: number; requiredQuantity: number }> {
  isSatisfiedBy(product: { currentStock: number; requiredQuantity: number }): boolean {
    return product.currentStock >= product.requiredQuantity
  }
}

export class ProductIsInStockSpecification extends AbstractSpecification<{ currentStock: number }> {
  isSatisfiedBy(product: { currentStock: number }): boolean {
    return product.currentStock > 0
  }
}

export class ProductIsLowStockSpecification extends AbstractSpecification<{ currentStock: number; lowStockThreshold: number }> {
  isSatisfiedBy(product: { currentStock: number; lowStockThreshold: number }): boolean {
    return product.currentStock <= product.lowStockThreshold
  }
}

export class ProductPriceWithinRangeSpecification extends AbstractSpecification<{ unitPrice: Money }> {
  constructor(
    private minimumPrice: Money,
    private maximumPrice: Money
  ) {
    super()
  }

  isSatisfiedBy(product: { unitPrice: Money }): boolean {
    return product.unitPrice.amount >= this.minimumPrice.amount && 
           product.unitPrice.amount <= this.maximumPrice.amount
  }
}

export class ProductHasValidSKUSpecification extends AbstractSpecification<{ sku: string }> {
  isSatisfiedBy(product: { sku: string }): boolean {
    return product.sku && product.sku.trim().length > 0 && /^[A-Z0-9-_]+$/.test(product.sku)
  }
}