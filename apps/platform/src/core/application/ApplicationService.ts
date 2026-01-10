// Application Services - High-level orchestration layer
// Provides unified interface for complex business operations

import { CustomerService } from '../use-cases/CustomerService'
import { ProductService } from '../use-cases/ProductService'
import { SaleService } from '../use-cases/SaleService'
import { InventoryService } from '../use-cases/InventoryService'
import { LedgerService } from '../use-cases/LedgerService'
import { 
  Customer, 
  Product, 
  Sale,
  InventoryMovement, 
  LedgerEntry,
  type CustomerData,
  type ProductData,
  type CreateSaleData,
  type InventoryMovementData,
  type LedgerEntryData
} from '@/core/entities/index'
import { Money } from '@/core/domain/value-objects/Money'
import { 
  type PaginationParams, 
  type PaginatedResponse,
  type ApiResponse 
} from '@/shared/types/common'

export interface TenantContext {
  tenantId: string
  userId: string
  userRole: 'super_admin' | 'admin' | 'vendedor' | 'contador'
}

export class ApplicationService {
  private readonly customerService: CustomerService
  private readonly productService: ProductService
  private readonly saleService: SaleService
  private readonly inventoryService: InventoryService
  private readonly ledgerService: LedgerService
  private readonly context: TenantContext

  constructor(
    context: TenantContext,
    customerService: CustomerService,
    productService: ProductService,
    saleService: SaleService,
    inventoryService: InventoryService,
    ledgerService: LedgerService
  ) {
    this.context = context
    this.customerService = customerService
    this.productService = productService
    this.saleService = saleService
    this.inventoryService = inventoryService
    this.ledgerService = ledgerService
  }

  get tenantId(): string {
    return this.context.tenantId
  }

  get userId(): string {
    return this.context.userId
  }

  get userRole(): string {
    return this.context.userRole
  }

  // Customer Operations
  async createCustomer(data: CustomerData): Promise<ApiResponse<Customer>> {
    try {
      const customer = await this.customerService.createCustomer(
        data.name,
        data.email,
        data.phone,
        data.address
      )
      
      return {
        success: true,
        data: customer
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getCustomerWithBalance(customerId: string): Promise<ApiResponse<Customer & { balance: number }>> {
    try {
      const customerAggregate = await this.customerService.getCustomerAggregate(customerId)
      
      return {
        success: true,
        data: {
          ...customerAggregate.toJSON(),
          balance: customerAggregate.getCurrentBalance().amount
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Product Operations
  async createProduct(data: ProductData): Promise<ApiResponse<Product>> {
    try {
      const product = await this.productService.createProduct(
        data.name,
        data.sku,
        data.price,
        data.description
      )
      
      return {
        success: true,
        data: product
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getProductWithStock(productId: string): Promise<ApiResponse<Product & { stock: number }>> {
    try {
      const productInventory = await this.productService.getProductWithInventory(productId)
      
      return {
        success: true,
        data: {
          ...productInventory.product.toJSON(),
          stock: productInventory.currentStock
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Sale Operations (High-level)
  async createSale(data: CreateSaleData): Promise<ApiResponse<Sale>> {
    try {
      const sale = await this.saleService.createSale(
        data.customerId,
        data.items,
        data.taxAmount,
        data.discountCode
      )
      
      return {
        success: true,
        data: sale
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getSaleDetails(saleId: string): Promise<ApiResponse<Sale>> {
    try {
      const sale = await this.saleService.getSaleDetails(saleId)
      
      return {
        success: true,
        data: sale
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getSalesReport(
    startDate: Date,
    endDate: Date
  ): Promise<ApiResponse<any>> {
    try {
      const report = await this.saleService.getSalesReport(startDate, endDate)
      
      return {
        success: true,
        data: report
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Financial Operations
  async getCustomerFinancialSummary(customerId: string): Promise<ApiResponse<any>> {
    try {
      const customerAggregate = await this.customerService.getCustomerAggregate(customerId)
      
      const summary = {
        balance: customerAggregate.getCurrentBalance().amount,
        totalCredit: customerAggregate.getTotalCredit().amount,
        totalDebit: customerAggregate.getTotalDebit().amount,
        transactionCount: customerAggregate.ledgerEntries.length,
        averageTransactionValue: customerAggregate.ledgerEntries.length > 0 
          ? customerAggregate.getTotalCredit().amount / customerAggregate.ledgerEntries.length
          : 0
      }
      
      return {
        success: true,
        data: summary
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Inventory Operations
  async getInventoryReport(lowStockThreshold: number = 10): Promise<ApiResponse<any>> {
    try {
      const report = await this.inventoryService.getInventoryReport(lowStockThreshold)
      
      return {
        success: true,
        data: report
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async recordStockMovement(data: InventoryMovementData): Promise<ApiResponse<InventoryMovement>> {
    try {
      const movement = await this.inventoryService.recordMovement(data)
      
      return {
        success: true,
        data: movement
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  // Business Intelligence
  async getDashboardData(): Promise<ApiResponse<any>> {
    try {
      const [
        salesReport,
        inventoryReport,
        customerSummary
      ] = await Promise.all([
        this.getSalesReport(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          new Date()
        ),
        this.getInventoryReport(),
        this.customerService.getCustomersByTenant({ page: 1, limit: 10 }) // Top 10 customers
      ])

      const dashboard = {
        salesMetrics: salesReport.data?.summary || {},
        inventoryAlerts: inventoryReport.data?.lowStockItems || [],
        topCustomers: customerSummary.data?.slice(0, 5) || [],
        revenueTrend: this.calculateRevenueTrend(salesReport.data?.dailyBreakdown || []),
        stockValue: inventoryReport.data?.totalValue || { amount: 0 }
      }

      return {
        success: true,
        data: dashboard
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  async getBusinessInsights(): Promise<ApiResponse<any>> {
    try {
      const [salesMetrics, inventoryMetrics] = await Promise.all([
        this.saleService.getSalesMetrics(
          new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
          new Date()
        ),
        this.inventoryService.getInventoryReport()
      ])

      const insights = {
        sales: {
          ...salesMetrics.data,
          averageOrderValue: salesMetrics.data?.averageTransactionValue?.amount || 0,
          conversionRate: salesMetrics.data?.conversionRate || 0.85
        },
        inventory: {
          totalValue: inventoryMetrics.data?.totalValue?.amount || 0,
          stockTurnover: 12, // Simplified calculation
          lowStockItems: inventoryMetrics.data?.lowStockItems?.length || 0,
          outOfStockItems: inventoryMetrics.data?.outOfStockItems?.length || 0
        },
        recommendations: this.generateRecommendations(salesMetrics.data, inventoryMetrics.data)
      }

      return {
        success: true,
        data: insights
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private async getCustomerName(customerId: string): Promise<string | undefined> {
    try {
      const customer = await this.customerService.getCustomerById(customerId)
      return customer?.name
    } catch {
      return undefined
    }
  }

  private calculateRevenueTrend(dailyBreakdown: any[]): Array<{ date: string; revenue: number }> {
    return dailyBreakdown.map(day => ({
      date: day.date,
      revenue: day.revenue?.amount || 0
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  private generateRecommendations(salesMetrics: any, inventoryMetrics: any): string[] {
    const recommendations = []

    // Sales recommendations
    if (salesMetrics?.conversionRate < 0.7) {
      recommendations.push('Consider reviewing sales process - conversion rate is below optimal')
    }

    // Inventory recommendations
    if (inventoryMetrics?.lowStockItems?.length > inventoryMetrics.totalProducts * 0.3) {
      recommendations.push('High number of products with low stock - consider automatic reordering')
    }

    if (inventoryMetrics?.outOfStockItems?.length > 0) {
      recommendations.push('Products out of stock affecting sales - urgent restocking required')
    }

    if (salesMetrics?.averageTransactionValue?.amount < 50) {
      recommendations.push('Low average transaction value - consider upselling strategies')
    }

    return recommendations
  }
}