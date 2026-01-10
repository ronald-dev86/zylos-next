// ServiceFactory - Dependency Injection Container
// Provides proper dependency injection for all services

import { ApplicationService, type TenantContext } from '@/core/application/ApplicationService'
import { CustomerService } from '@/core/use-cases/CustomerService'
import { ProductService } from '@/core/use-cases/ProductService'
import { SaleService } from '@/core/use-cases/SaleService'
import { InventoryService } from '@/core/use-cases/InventoryService'
import { LedgerService } from '@/core/use-cases/LedgerService'

// Repository Interfaces
import { ICustomerRepository } from '@/core/services/ICustomerRepository'
import { IProductRepository } from '@/core/services/IProductRepository'
import { ISaleRepository } from '@/infrastructure/database/SupabaseSaleRepository'
import { IInventoryMovementRepository } from '@/core/services/IInventoryMovementRepository'
import { ILedgerEntryRepository } from '@/core/services/ILedgerEntryRepository'
import { ISupplierRepository } from '@/core/services/ISupplierRepository'

// Domain Services
import { PricingCalculation } from '@/core/domain/services/PricingService'
import { SalesService } from '@/core/domain/services/SalesService'
import { FinancialService } from '@/core/domain/services/FinancialService'

export class ServiceFactory {
  private readonly tenantId: string
  
  // Repository instances - these would be injected/created based on your infrastructure
  private readonly customerRepository: ICustomerRepository
  private readonly productRepository: IProductRepository
  private readonly saleRepository: ISaleRepository
  private readonly inventoryRepository: IInventoryMovementRepository
  private readonly ledgerRepository: ILedgerEntryRepository
  private readonly supplierRepository: ISupplierRepository

  // Domain service instances
  private readonly pricingService: PricingCalculation
  private readonly salesService: SalesService
  private readonly financialService: FinancialService

  constructor(
    tenantId: string,
    repositories: {
      customerRepository: ICustomerRepository
      productRepository: IProductRepository
      saleRepository: ISaleRepository
      inventoryRepository: IInventoryMovementRepository
      ledgerRepository: ILedgerEntryRepository
      supplierRepository: ISupplierRepository
    }
  ) {
    this.tenantId = tenantId
    
    // Initialize repositories
    this.customerRepository = repositories.customerRepository
    this.productRepository = repositories.productRepository
    this.saleRepository = repositories.saleRepository
    this.inventoryRepository = repositories.inventoryRepository
    this.ledgerRepository = repositories.ledgerRepository
    this.supplierRepository = repositories.supplierRepository

    // Initialize domain services
    this.pricingService = new PricingCalculation()
    this.salesService = new SalesService()
    this.financialService = new FinancialService(ledgerRepository)
  }

  // Create ApplicationService with all dependencies injected
  createApplicationService(userId: string, userRole: 'super_admin' | 'admin' | 'vendedor' | 'contador'): ApplicationService {
    const context: TenantContext = {
      tenantId: this.tenantId,
      userId,
      userRole
    }

    // Create service instances with proper dependencies
    const customerService = new CustomerService(
      this.customerRepository,
      this.ledgerRepository
    )

    const productService = new ProductService(
      this.productRepository,
      this.inventoryRepository
    )

    const saleService = new SaleService(
      this.saleRepository,
      this.customerRepository,
      this.productRepository,
      this.pricingService,
      this.salesService
    )

    const inventoryService = new InventoryService(
      this.inventoryRepository,
      this.productRepository
    )

    const ledgerService = new LedgerService(
      this.ledgerRepository,
      this.customerRepository,
      this.supplierRepository,
      this.financialService
    )

    return new ApplicationService(
      context,
      customerService,
      productService,
      saleService,
      inventoryService,
      ledgerService
    )
  }

  // Individual service creation methods for testing or specific use cases
  createCustomerService(): CustomerService {
    return new CustomerService(
      this.customerRepository,
      this.ledgerRepository
    )
  }

  createProductService(): ProductService {
    return new ProductService(
      this.productRepository,
      this.inventoryRepository
    )
  }

  createSaleService(): SaleService {
    return new SaleService(
      this.saleRepository,
      this.customerRepository,
      this.productRepository,
      this.pricingService,
      this.salesService
    )
  }

  createInventoryService(): InventoryService {
    return new InventoryService(
      this.inventoryRepository,
      this.productRepository
    )
  }

  createLedgerService(): LedgerService {
    return new LedgerService(
      this.ledgerRepository,
      this.customerRepository,
      this.supplierRepository,
      this.financialService
    )
  }

  // Getters for repositories (useful for testing)
  getRepositories() {
    return {
      customerRepository: this.customerRepository,
      productRepository: this.productRepository,
      saleRepository: this.saleRepository,
      inventoryRepository: this.inventoryRepository,
      ledgerRepository: this.ledgerRepository,
      supplierRepository: this.supplierRepository
    }
  }
}