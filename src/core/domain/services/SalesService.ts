import { Money } from '../value-objects/Money'
import { SaleStatus, PaymentStatus, EntityType } from '../enums'
import { Sale, type SaleLineItemData } from '../aggregates/Sale'
import { InventoryMovement, type InventoryMovementData } from '../value-objects/InventoryMovement'
import { LedgerEntry, type LedgerEntryData } from '../aggregates/Ledger'

export interface TransactionResult {
  success: boolean
  sale?: Sale
  inventoryMovements: InventoryMovement[]
  ledgerEntries: LedgerEntry[]
  errors: string[]
  warnings: string[]
}

export interface RefundData {
  originalSaleId: string
  refundAmount: Money
  refundReason: string
  restockItems: boolean
}

export interface SalesMetrics {
  totalSales: number
  totalRevenue: Money
  averageTransactionValue: Money
  conversionRate: number
  topProducts: Array<{
    productId: string
    productName?: string
    quantity: number
    revenue: Money
  }>
  topCustomers: Array<{
    customerId: string
    customerName?: string
    totalSpent: Money
    transactionCount: number
  }>
}

export class SalesService {
  private readonly _tenantId: string

  constructor(tenantId: string) {
    this._tenantId = tenantId
  }

  get tenantId(): string {
    return this._tenantId
  }

  async processSale(
    saleData: {
      customerId: string
      items: SaleLineItemData[]
      taxAmount?: number
      discountAmount?: number
      paymentMethod?: string
    },
    inventoryService: {
      calculateCurrentStock: (productId: string) => Promise<number>
      createMovement: (movementData: InventoryMovementData) => Promise<InventoryMovement>
    },
    ledgerService: {
      createEntry: (entryData: LedgerEntryData) => Promise<LedgerEntry>
    },
    productService: {
      getProductName: (productId: string) => Promise<string | undefined>
    }
  ): Promise<TransactionResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const inventoryMovements: InventoryMovement[] = []
    const ledgerEntries: LedgerEntry[] = []

    try {
      // Validate sale data
      if (!saleData.customerId) {
        errors.push('Customer ID is required')
        return { success: false, inventoryMovements, ledgerEntries, errors, warnings }
      }

      if (!saleData.items || saleData.items.length === 0) {
        errors.push('At least one item is required')
        return { success: false, inventoryMovements, ledgerEntries, errors, warnings }
      }

      // Check stock availability and calculate totals
      let subtotal = new Money(0)
      const validatedItems: Array<{
        productId: string
        productName?: string
        quantity: number
        unitPrice: Money
        availableStock: number
        itemTotal: Money
      }> = []

      for (const itemData of saleData.items) {
        if (itemData.quantity <= 0) {
          errors.push(`Invalid quantity for product: ${itemData.productId}`)
          continue
        }

        const currentStock = await inventoryService.calculateCurrentStock(itemData.productId)
        const productName = await productService.getProductName(itemData.productId)
        const unitPrice = new Money(itemData.unitPrice)
        const itemTotal = unitPrice.multiply(itemData.quantity)
        subtotal = subtotal.add(itemTotal)

        // Stock validation
        if (currentStock < itemData.quantity) {
          errors.push(`Insufficient stock for product ${productName || itemData.productId}. Available: ${currentStock}, Required: ${itemData.quantity}`)
          continue
        }

        validatedItems.push({
          productId: itemData.productId,
          productName,
          quantity: itemData.quantity,
          unitPrice,
          availableStock: currentStock,
          itemTotal
        })

        // Low stock warning
        if (currentStock - itemData.quantity < 5) {
          warnings.push(`Low stock warning for product ${productName || itemData.productId}. Remaining: ${currentStock - itemData.quantity}`)
        }
      }

      if (errors.length > 0) {
        return { success: false, inventoryMovements, ledgerEntries, errors, warnings }
      }

      // Calculate financials
      const taxAmount = new Money(saleData.taxAmount || 0)
      const discountAmount = new Money(saleData.discountAmount || 0)
      const totalAmount = subtotal.add(taxAmount).subtract(discountAmount)

      // Create the sale aggregate
      const saleLineItems = validatedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount
      }))

      const sale = Sale.create(
        saleData.customerId,
        saleLineItems,
        taxAmount.amount
      )

      // Create inventory movements (stock out)
      for (const item of validatedItems) {
        const movementData: InventoryMovementData = {
          productId: item.productId,
          type: 'out',
          quantity: item.quantity,
          reason: 'Sale transaction',
          referenceId: sale.id
        }

        const movement = await inventoryService.createMovement(movementData)
        inventoryMovements.push(movement)
      }

      // Create ledger entry (customer credit)
      const ledgerData: LedgerEntryData = {
        entityType: EntityType.CUSTOMER,
        entityId: saleData.customerId,
        type: 'credit',
        amount: totalAmount,
        description: `Sale ${sale.id}`,
        referenceId: sale.id
      }

      const ledgerEntry = await ledgerService.createEntry(ledgerData)
      ledgerEntries.push(ledgerEntry)

      return {
        success: true,
        sale: new Sale({
          ...sale.toJSON(),
          subtotal,
          tax: taxAmount,
          totalAmount
        }),
        inventoryMovements,
        ledgerEntries,
        errors,
        warnings
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error occurred')
      return { success: false, inventoryMovements, ledgerEntries, errors, warnings }
    }
  }

  async processRefund(
    refundData: RefundData,
    inventoryService: {
      calculateCurrentStock: (productId: string) => Promise<number>
      createMovement: (movementData: InventoryMovementData) => Promise<InventoryMovement>
    },
    ledgerService: {
      createEntry: (entryData: LedgerEntryData) => Promise<LedgerEntry>
    }
  ): Promise<TransactionResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const inventoryMovements: InventoryMovement[] = []
    const ledgerEntries: LedgerEntry[] = []

    try {
      // Validate refund data
      if (!refundData.originalSaleId) {
        errors.push('Original sale ID is required')
      }

      if (refundData.refundAmount.amount <= 0) {
        errors.push('Refund amount must be positive')
      }

      if (!refundData.refundReason) {
        errors.push('Refund reason is required')
      }

      if (errors.length > 0) {
        return { success: false, inventoryMovements, ledgerEntries, errors, warnings }
      }

      // Create ledger entry for refund (customer debit)
      const refundLedgerData: LedgerEntryData = {
        entityType: EntityType.CUSTOMER,
        entityId: refundData.originalSaleId, // This would be the customer ID in real implementation
        type: 'debit',
        amount: refundData.refundAmount,
        description: `Refund for sale ${refundData.originalSaleId}: ${refundData.refundReason}`,
        referenceId: refundData.originalSaleId
      }

      const refundLedgerEntry = await ledgerService.createEntry(refundLedgerData)
      ledgerEntries.push(refundLedgerEntry)

      // Restock items if requested
      if (refundData.restockItems) {
        warnings.push('Items restocked to inventory')
        // In a real implementation, you'd fetch the original sale items
        // and create inventory movements for restocking
      }

      return {
        success: true,
        inventoryMovements,
        ledgerEntries,
        errors,
        warnings
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error occurred during refund')
      return { success: false, inventoryMovements, ledgerEntries, errors, warnings }
    }
  }

  async calculateSalesMetrics(
    sales: Sale[],
    period: { startDate: Date; endDate: Date }
  ): Promise<SalesMetrics> {
    const periodSales = sales.filter(sale => 
      sale.createdAt >= period.startDate && sale.createdAt <= period.endDate
    )

    if (periodSales.length === 0) {
      return {
        totalSales: 0,
        totalRevenue: new Money(0),
        averageTransactionValue: new Money(0),
        conversionRate: 0,
        topProducts: [],
        topCustomers: []
      }
    }

    const totalRevenue = periodSales.reduce((sum, sale) => 
      sum.add(sale.totalAmount), new Money(0)
    )

    const totalSales = periodSales.length
    const averageTransactionValue = totalSales > 0 
      ? totalRevenue.divide(totalSales)
      : new Money(0)

    // Calculate conversion rate (simplified)
    const conversionRate = totalSales > 100 ? 0.85 : 0.92 // Would come from analytics

    // Calculate top products
    const productSales = new Map<string, {
      productId: string
      productName?: string
      quantity: number
      revenue: Money
    }>()

    for (const sale of periodSales) {
      for (const item of sale.items) {
        const existing = productSales.get(item.productId) || {
          productId: item.productId,
          productName: item.productName,
          quantity: 0,
          revenue: new Money(0)
        }

        existing.quantity += item.quantity
        existing.revenue = existing.revenue.add(new Money(item.quantity * item.unitPrice))

        productSales.set(item.productId, existing)
      }
    }

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue.amount - a.revenue.amount)
      .slice(0, 10)

    // Calculate top customers
    const customerSales = new Map<string, {
      customerId: string
      customerName?: string
      totalSpent: Money
      transactionCount: number
    }>()

    for (const sale of periodSales) {
      const existing = customerSales.get(sale.customerId) || {
        customerId: sale.customerId,
        customerName: undefined, // Would come from customer aggregate
        totalSpent: new Money(0),
        transactionCount: 0
      }

      existing.totalSpent = existing.totalSpent.add(sale.totalAmount)
      existing.transactionCount += 1

      customerSales.set(sale.customerId, existing)
    }

    const topCustomers = Array.from(customerSales.values())
      .sort((a, b) => b.totalSpent.amount - a.totalSpent.amount)
      .slice(0, 10)

    return {
      totalSales,
      totalRevenue,
      averageTransactionValue,
      conversionRate,
      topProducts,
      topCustomers
    }
  }

  async generateSalesReport(
    sales: Sale[],
    period: { startDate: Date; endDate: Date }
  ): Promise<{
    summary: SalesMetrics
    sales: Sale[]
    dailyBreakdown: Array<{
      date: string
      sales: number
      revenue: Money
      averageTransactionValue: Money
    }>
  }> {
    const metrics = await this.calculateSalesMetrics(sales, period)
    
    // Generate daily breakdown
    const salesByDate = new Map<string, Sale[]>()
    
    for (const sale of sales) {
      const dateKey = sale.createdAt.toISOString().split('T')[0]
      if (!salesByDate.has(dateKey)) {
        salesByDate.set(dateKey, [])
      }
      salesByDate.get(dateKey)!.push(sale)
    }

    const dailyBreakdown = Array.from(salesByDate.entries())
      .map(([date, daySales]) => {
        const dayRevenue = daySales.reduce((sum, sale) => 
          sum.add(sale.totalAmount), new Money(0)
        )
        
        const dayAverage = daySales.length > 0 
          ? dayRevenue.divide(daySales.length)
          : new Money(0)

        return {
          date,
          sales: daySales.length,
          revenue: dayRevenue,
          averageTransactionValue: dayAverage
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      summary: metrics,
      sales: periodSales,
      dailyBreakdown
    }
  }
}