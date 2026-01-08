import { Sale, type CreateSaleData, type SaleLineItemData } from '@/core/domain/aggregates/Sale'
import { CustomerAggregate } from '@/core/domain/aggregates/Customer'
import { ProductInventory } from '@/core/domain/aggregates/ProductInventory'
import { PricingCalculation, type TransactionResult } from '@/core/domain/services/PricingService'
import { SalesService, type RefundData } from '@/core/domain/services/SalesService'
import { SaleCreatedEvent, SaleCompletedEvent, SaleCancelledEvent, PaymentReceivedEvent } from '@/core/domain/events/SaleEvents'
import { ISaleRepository } from '@/infrastructure/database/SupabaseSaleRepository'
import { ICustomerRepository } from '@/core/services/ICustomerRepository'
import { IProductRepository } from '@/core/services/IProductRepository'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SaleService {
  constructor(
    private saleRepository: ISaleRepository,
    private customerRepository: ICustomerRepository,
    private productRepository: IProductRepository,
    private pricingService: PricingService,
    private salesService: SalesService
  ) {}

  async createSale(
    customerId: string,
    items: Array<{
      productId: string
      quantity: number
      unitPrice: number
    }>,
    taxAmount?: number,
    discountCode?: string
  ): Promise<Sale> {
    // Validate customer
    const customer = await this.customerRepository.findById(customerId)
    if (!customer) {
      throw new Error('Customer not found')
    }

    // Validate all products and inventory
    const validatedItems = await Promise.all(
      items.map(async (item) => {
        const productInventory = await this.productRepository.findById(item.productId)
        if (!productInventory) {
          throw new Error(`Product not found: ${item.productId}`)
        }

        if (!productInventory.hasSufficientStock(item.quantity)) {
          throw new Error(`Insufficient stock for product: ${productInventory.productName || item.productId}. Current: ${productInventory.currentStock}, Required: ${item.quantity}`)
        }

        return {
          productId: item.productId,
          productName: productInventory.productName,
          quantity: item.quantity,
          unitPrice: new Money(item.unitPrice)
        }
      })
    )

    // Calculate pricing using domain service
    const pricing = this.pricingService.calculateTotal(
      validatedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount
      })),
      customerId
    )

    // Apply discount code if provided
    const discountAmount = discountCode 
      ? this.pricingService.applyDiscountCode(discountCode, pricing.subtotal, validatedItems)
      : pricing.discount

    const finalPricing = this.pricingService.calculateTotal(
      validatedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount
      })),
      customerId
    )

    // Create sale entity
    const saleData: CreateSaleData = {
      customerId,
      items: validatedItems.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice.amount
      })),
      taxAmount: pricing.tax.amount,
      discountAmount: discountAmount.amount
    }

    const sale = Sale.create(customerId, saleData.items, saleData.taxAmount)
    
    // Persist sale using repository
    const persistedSale = await this.saleRepository.create({
      customerId: sale.customerId,
      items: saleData.items,
      tax: finalPricing.tax.amount
    })

    // Publish domain event
    this.salesService.publishEvent(new SaleCreatedEvent({
      saleId: persistedSale.id,
      customerId,
      totalAmount: persistedSale.totalAmount,
      items: persistedSale.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      })),
      status: persistedSale.status,
      paymentStatus: persistedSale.paymentStatus
    }))

    return persistedSale
  }

  async completeSale(
    saleId: string,
    paymentAmount?: number,
    paymentMethod?: string
  ): Promise<Sale> {
    const sale = await this.saleRepository.findById(saleId)
    if (!sale) {
      throw new Error('Sale not found')
    }

    // Mark as completed
    const completedSale = await this.saleRepository.updateStatus(saleId, 'completed')
    
    // Record payment if provided
    if (paymentAmount && paymentAmount > 0) {
      await this.salesService.recordPayment({
        saleId,
        customerId: sale.customerId,
        amount: paymentAmount,
        paymentMethod
      })
    }

    // Publish completion event
    this.salesService.publishEvent(new SaleCompletedEvent({
      saleId,
      customerId: sale.customerId,
      totalAmount: completedSale.totalAmount,
      completedAt: new Date()
    }))

    return await this.saleRepository.findById(saleId)
  }

  async cancelSale(saleId: string, reason?: string): Promise<Sale> {
    const sale = await this.saleRepository.findById(saleId)
    if (!sale) {
      throw new Error('Sale not found')
    }

    if (!sale.canBeCancelled()) {
      throw new Error('Sale cannot be cancelled')
    }

    // Mark as cancelled
    const cancelledSale = await this.saleRepository.updateStatus(saleId, 'cancelled')
    
    // Handle inventory restocking if needed
    await this.salesService.handleSaleCancellation(saleId, reason)
    
    // Publish cancellation event
    this.salesService.publishEvent(new SaleCancelledEvent({
      saleId,
      customerId: sale.customerId,
      reason: reason || 'Manual cancellation',
      cancelledAt: new Date()
    }))

    return cancelledSale
  }

  async processRefund(
    refundData: RefundData
  ): Promise<TransactionResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validate original sale
      const originalSale = await this.saleRepository.findById(refundData.originalSaleId)
      if (!originalSale) {
        errors.push('Original sale not found')
        return { success: false, errors, warnings }
      }

      if (!originalSale.isCompleted()) {
        errors.push('Cannot refund incomplete sale')
        return { success: false, errors, warnings }
      }

      // Process refund through domain service
      const refundResult = await this.salesService.processRefund({
        ...refundData,
        saleTotalAmount: originalSale.totalAmount
      })

      // Publish refund event if successful
      if (refundResult.success) {
        this.salesService.publishEvent(new SaleCancelledEvent({
          saleId: refundData.originalSaleId,
          customerId: originalSale.customerId,
          reason: `Refund: ${refundData.refundReason}`,
          cancelledAt: new Date()
        }))
      }

      return refundResult

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error occurred during refund')
      return { success: false, errors, warnings }
    }
  }

  async getSalesByCustomer(
    customerId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Sale>> {
    return await this.saleRepository.findByCustomerId(customerId, pagination)
  }

  async getSalesByTenant(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Sale>> {
    return await this.saleRepository.findByTenantId(pagination)
  }

  async searchSalesByDateRange(
    startDate: Date,
    endDate: Date,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Sale>> {
    return await this.saleRepository.findByDateRange(startDate, endDate, pagination)
  }

  async getSalesMetrics(
    startDate: Date,
    endDate: Date
  ) {
    const sales = await this.salesService.generateSalesReport(
      await this.getSalesByDateRange(startDate, endDate, { page: 1, limit: 1000 })
    )

    return {
      totalSales: sales.summary.totalSales,
      totalRevenue: sales.summary.totalRevenue,
      averageTransactionValue: sales.summary.averageTransactionValue,
      conversionRate: sales.summary.conversionRate,
      topProducts: sales.summary.topProducts,
      topCustomers: sales.summary.topCustomers
    }
  }

  async getSaleDetails(saleId: string): Promise<Sale | null> {
    const sale = await this.saleRepository.findById(saleId)
    if (!sale) return null

    // Enrich with customer details and product details
    const customer = await this.customerRepository.findById(sale.customerId)
    const enrichedItems = await Promise.all(
      sale.items.map(async (item) => {
        const productInventory = await this.productRepository.findById(item.productId)
        return {
          ...item,
          productName: productInventory?.productName,
          currentStock: productInventory?.currentStock || 0
        }
      })
    )

    return {
      ...sale,
      customerName: customer?.name,
      items: enrichedItems
    }
  }
}