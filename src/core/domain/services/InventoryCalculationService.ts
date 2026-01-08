import { Money } from '../value-objects/Money'
import { SaleLineItem, type SaleLineItemData } from '../aggregates/Sale'
import { InventoryMovement, type InventoryMovementData } from '../value-objects/InventoryMovement'

export interface StockAlertLevel {
  productId: string
  productName?: string
  currentStock: number
  lowStockThreshold: number
  outOfStockThreshold: number
  status: 'normal' | 'low' | 'out' | 'critical'
}

export interface InventoryCalculation {
  productId: string
  productName?: string
  currentStock: number
  valuePerUnit: Money
  totalValue: Money
  recentMovements: InventoryMovement[]
  turnoverRate: number // units per month
  reorderPoint: number
  reorderQuantity: number
}

export interface InventoryReport {
  totalProducts: number
  totalValue: Money
  lowStockItems: StockAlertLevel[]
  outOfStockItems: StockAlertLevel[]
  topSellingProducts: Array<{
    productId: string
    productName?: string
    quantity: number
    revenue: Money
  }>
  monthlyTurnover: Money
}

export class InventoryCalculationService {
  calculateStockLevel(
    currentStock: number,
    lowStockThreshold: number = 10,
    outOfStockThreshold: number = 0
  ): 'normal' | 'low' | 'out' | 'critical' {
    if (currentStock <= outOfStockThreshold) {
      return 'out'
    } else if (currentStock <= lowStockThreshold) {
      return 'low'
    } else if (currentStock === 0) {
      return 'critical'
    } else {
      return 'normal'
    }
  }

  calculateReorderPoint(
    averageMonthlyUsage: number,
    leadTimeDays: number = 7,
    safetyStockDays: number = 3
  ): number {
    const dailyUsage = averageMonthlyUsage / 30
    return Math.ceil(dailyUsage * (leadTimeDays + safetyStockDays))
  }

  calculateTurnoverRate(movements: InventoryMovement[], days: number = 30): number {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const recentMovements = movements.filter(movement => 
      movement.createdAt >= cutoffDate
    )

    const totalOutgoing = recentMovements
      .filter(movement => movement.isStockOutflow())
      .reduce((sum, movement) => sum + movement.quantity, 0)

    return totalOutgoing / days // units per day
  }

  generateStockAlerts(
    products: Array<{
      productId: string
      productName?: string
      currentStock: number
      lowStockThreshold?: number
      unitPrice: Money
    }>,
    movements: Record<string, InventoryMovement[]>
  ): StockAlertLevel[] {
    return products.map(product => {
      const productMovements = movements[product.productId] || []
      const currentStock = product.currentStock
      const lowThreshold = product.lowStockThreshold || 10
      const outThreshold = 0

      return {
        productId: product.productId,
        productName: product.productName,
        currentStock,
        lowStockThreshold,
        outOfStockThreshold: outThreshold,
        status: this.calculateStockLevel(currentStock, lowThreshold, outThreshold)
      }
    }).filter(alert => alert.status !== 'normal')
  }

  calculateInventoryValue(
    products: Array<{
      productId: string
      productName?: string
      currentStock: number
      unitPrice: Money
    }>,
    movements: Record<string, InventoryMovement[]>
  ): InventoryReport {
    const totalProducts = products.length
    
    const totalValue = products.reduce((sum, product) => {
      const productValue = new Money(product.currentStock * product.unitPrice.amount)
      return sum.add(productValue)
    }, new Money(0))

    const stockAlerts = this.generateStockAlerts(products, movements)
    
    const lowStockItems = stockAlerts.filter(alert => 
      alert.status === 'low' || alert.status === 'critical'
    )
    
    const outOfStockItems = stockAlerts.filter(alert => alert.status === 'out')

    // Calculate top selling products
    const topSellingProducts = products
      .map(product => {
        const productMovements = movements[product.productId] || []
        const recentOutgoing = productMovements
          .filter(movement => 
            movement.isStockOutflow() && 
            movement.createdAt >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          )
          .reduce((sum, movement) => sum + movement.quantity, 0)
        
        const revenue = new Money(recentOutgoing * product.unitPrice.amount)
        
        return {
          productId: product.productId,
          productName: product.productName,
          quantity: recentOutgoing,
          revenue
        }
      })
      .sort((a, b) => b.revenue.amount - a.revenue.amount)
      .slice(0, 10)

    // Calculate monthly turnover
    const monthlyTurnover = totalValue // Simplified - should be based on sales

    return {
      totalProducts,
      totalValue,
      lowStockItems,
      outOfStockItems,
      topSellingProducts,
      monthlyTurnover
    }
  }

  optimizeReorderQuantities(
    products: Array<{
      productId: string
      currentStock: number
      reorderPoint: number
      maxOrderQuantity?: number
    }>
  ): Array<{
    productId: string
    recommendedOrderQuantity: number
    reason: string
  }> {
    return products.map(product => {
      if (product.currentStock >= product.reorderPoint) {
        return {
          productId: product.productId,
          recommendedOrderQuantity: 0,
          reason: 'Sufficient stock'
        }
      }

      const recommendedOrderQuantity = Math.min(
        product.reorderPoint - product.currentStock,
        product.maxOrderQuantity || 100 // Default max order quantity
      )

      return {
        productId: product.productId,
        recommendedOrderQuantity,
        reason: `Reorder needed. Current: ${product.currentStock}, Reorder point: ${product.reorderPoint}`
      }
    }).filter(item => item.recommendedOrderQuantity > 0)
  }
}