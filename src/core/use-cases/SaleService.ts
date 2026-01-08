import { Sale, ISaleRepository, CreateSaleData } from '@/infrastructure/database/SupabaseSaleRepository'
import { ICustomerRepository } from '../services/ICustomerRepository'
import { IProductRepository } from '../services/IProductRepository'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SaleService {
  constructor(
    private saleRepository: ISaleRepository,
    private customerRepository: ICustomerRepository,
    private productRepository: IProductRepository
  ) {}

  async createSale(
    customerId: string,
    items: Array<{
      productId: string
      quantity: number
      unitPrice: number
    }>,
    tax?: number
  ): Promise<Sale> {
    // Validate customer exists
    const customer = await this.customerRepository.findById(customerId)
    if (!customer) {
      throw new Error('Customer not found')
    }

    // Validate all products exist and have sufficient stock
    for (const item of items) {
      const product = await this.productRepository.findById(item.productId)
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`)
      }

      // Get current stock from sale repository (it uses inventory repository internally)
      const saleRepository = this.saleRepository as any
      const currentStock = await saleRepository.calculateCurrentStock?.(item.productId) || 0
      
      if (currentStock < item.quantity) {
        throw new Error(
          `Insufficient stock for product ${product.name}. Current: ${currentStock}, Required: ${item.quantity}`
        )
      }

      // Validate price matches current product price (optional business rule)
      if (Math.abs(item.unitPrice - product.price) > 0.01) {
        throw new Error(
          `Price mismatch for product ${product.name}. Expected: ${product.price}, Provided: ${item.unitPrice}`
        )
      }
    }

    const saleData: CreateSaleData = {
      customerId,
      items,
      tax: tax || 0
    }

    return await this.saleRepository.create(saleData)
  }

  async getSaleById(id: string): Promise<Sale | null> {
    return await this.saleRepository.findById(id)
  }

  async getSalesByCustomer(
    customerId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Sale>> {
    // Validate customer exists
    const customer = await this.customerRepository.findById(customerId)
    if (!customer) {
      throw new Error('Customer not found')
    }

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

  async updateSaleStatus(
    id: string,
    status: Sale['status']
  ): Promise<Sale> {
    return await this.saleRepository.updateStatus(id, status)
  }

  async updateSalePaymentStatus(
    id: string,
    paymentStatus: Sale['paymentStatus']
  ): Promise<Sale> {
    return await this.saleRepository.updatePaymentStatus(id, paymentStatus)
  }

  async cancelSale(id: string): Promise<Sale> {
    const sale = await this.getSaleById(id)
    if (!sale) {
      throw new Error('Sale not found')
    }

    if (sale.status === 'cancelled') {
      throw new Error('Sale is already cancelled')
    }

    if (sale.status === 'completed' && sale.paymentStatus === 'paid') {
      throw new Error('Cannot cancel completed and paid sale')
    }

    return await this.updateSaleStatus(id, 'cancelled')
  }

  async getSalesSummary(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalSales: number
    totalRevenue: number
    totalItems: number
  }> {
    return await this.saleRepository.getSalesSummary(startDate, endDate)
  }

  async getTopCustomersByRevenue(
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{
    customerId: string
    customerName: string
    totalRevenue: number
    totalSales: number
  }>> {
    const sales = await this.searchSalesByDateRange(startDate, endDate, { page: 1, limit: 1000 })
    
    // Aggregate sales by customer
    const customerRevenue = new Map<string, {
      customerId: string
      customerName: string
      totalRevenue: number
      totalSales: number
    }>()

    for (const sale of sales.data) {
      const existing = customerRevenue.get(sale.customerId) || {
        customerId: sale.customerId,
        customerName: sale.customerName || 'Unknown',
        totalRevenue: 0,
        totalSales: 0
      }

      existing.totalRevenue += sale.totalAmount
      existing.totalSales += 1

      customerRevenue.set(sale.customerId, existing)
    }

    return Array.from(customerRevenue.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
  }

  async getTopSellingProducts(
    startDate: Date,
    endDate: Date,
    limit: number = 10
  ): Promise<Array<{
    productId: string
    productName: string
    totalQuantity: number
    totalRevenue: number
  }>> {
    const sales = await this.searchSalesByDateRange(startDate, endDate, { page: 1, limit: 1000 })
    
    // Aggregate sales by product
    const productSales = new Map<string, {
      productId: string
      productName: string
      totalQuantity: number
      totalRevenue: number
    }>()

    for (const sale of sales.data) {
      for (const item of sale.items) {
        const existing = productSales.get(item.productId) || {
          productId: item.productId,
          productName: item.productName,
          totalQuantity: 0,
          totalRevenue: 0
        }

        existing.totalQuantity += item.quantity
        existing.totalRevenue += item.totalPrice

        productSales.set(item.productId, existing)
      }
    }

    return Array.from(productSales.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit)
  }

  async getSalesWithPendingPayment(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Sale>> {
    const allSales = await this.getSalesByTenant(pagination)
    
    const pendingSales = allSales.data.filter(
      sale => sale.paymentStatus === 'pending'
    )

    return {
      data: pendingSales,
      pagination: allSales.pagination
    }
  }

  async recordPayment(
    saleId: string,
    amount: number
  ): Promise<Sale> {
    const sale = await this.getSaleById(saleId)
    if (!sale) {
      throw new Error('Sale not found')
    }

    if (sale.paymentStatus === 'paid') {
      throw new Error('Sale is already fully paid')
    }

    if (amount <= 0) {
      throw new Error('Payment amount must be positive')
    }

    // For now, we'll update to paid if amount covers full sale
    // In a real implementation, you'd track partial payments
    const newPaymentStatus = amount >= sale.totalAmount ? 'paid' : 'partial'
    
    return await this.updateSalePaymentStatus(saleId, newPaymentStatus)
  }
}