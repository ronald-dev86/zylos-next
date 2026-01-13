// RepositoryFactory - Centralized repository creation with proper dependency injection
// Provides factory methods for all repositories with tenant context

// Repository Interfaces
import { ICustomerRepository } from '@/core/services/ICustomerRepository'
import { IProductRepository } from '@/core/services/IProductRepository'
import { ISaleRepository } from '@/infrastructure/database/SupabaseSaleRepository'
import { IInventoryMovementRepository } from '@/core/services/IInventoryMovementRepository'
import { ILedgerEntryRepository } from '@/core/services/ILedgerEntryRepository'
import { ISupplierRepository } from '@/core/services/ISupplierRepository'
import { ITenantRepository } from '@/core/services/ITenantRepository'
import { IUserRepository } from '@/core/services/IUserRepository'

// Repository Implementations
import { SupabaseCustomerRepository } from '@/infrastructure/database/SupabaseCustomerRepository'
import { SupabaseProductRepository } from '@/infrastructure/database/SupabaseProductRepository'
import { SupabaseSaleRepository } from '@/infrastructure/database/SupabaseSaleRepository'
import { SupabaseInventoryMovementRepository } from '@/infrastructure/database/SupabaseInventoryMovementRepository'
import { SupabaseLedgerEntryRepository } from '@/infrastructure/database/SupabaseLedgerEntryRepository'
import { SupabaseSupplierRepository } from '@/infrastructure/database/SupabaseSupplierRepository'
import { SupabaseTenantRepository } from '@/infrastructure/database/SupabaseTenantRepository'
import { SupabaseUserRepository } from '@/infrastructure/database/SupabaseUserRepository'

// Domain Services
import { PricingService } from '@/core/domain/services/PricingService'
import { SalesService } from '@/core/domain/services/SalesService'
import { FinancialService } from '@/core/domain/services/FinancialService'

export class RepositoryFactory {
  private static instances = new Map<string, RepositoryFactory>()
  
  private readonly tenantId: string
  private readonly repositories: Map<string, any> = new Map()

  private constructor(tenantId: string) {
    this.tenantId = tenantId
  }

  // Singleton pattern per tenant
  static getInstance(tenantId: string): RepositoryFactory {
    if (!this.instances.has(tenantId)) {
      this.instances.set(tenantId, new RepositoryFactory(tenantId))
    }
    return this.instances.get(tenantId)!
  }

  // Create new instance (not singleton)
  static create(tenantId: string): RepositoryFactory {
    return new RepositoryFactory(tenantId)
  }

  // Customer Repository
  getCustomerRepository(): ICustomerRepository {
    const cacheKey = 'customer'
    
    if (!this.repositories.has(cacheKey)) {
      this.repositories.set(cacheKey, new SupabaseCustomerRepository(this.tenantId))
    }
    
    return this.repositories.get(cacheKey)!
  }

  // Product Repository
  getProductRepository(): IProductRepository {
    const cacheKey = 'product'
    
    if (!this.repositories.has(cacheKey)) {
      this.repositories.set(cacheKey, new SupabaseProductRepository(this.tenantId))
    }
    
    return this.repositories.get(cacheKey)!
  }

  // Sale Repository
  getSaleRepository(): ISaleRepository {
    const cacheKey = 'sale'
    
    if (!this.repositories.has(cacheKey)) {
      this.repositories.set(cacheKey, new SupabaseSaleRepository(this.tenantId))
    }
    
    return this.repositories.get(cacheKey)!
  }

  // Inventory Movement Repository
  getInventoryMovementRepository(): IInventoryMovementRepository {
    const cacheKey = 'inventory-movement'
    
    if (!this.repositories.has(cacheKey)) {
      this.repositories.set(cacheKey, new SupabaseInventoryMovementRepository(this.tenantId))
    }
    
    return this.repositories.get(cacheKey)!
  }

  // Ledger Entry Repository
  getLedgerEntryRepository(): ILedgerEntryRepository {
    const cacheKey = 'ledger-entry'
    
    if (!this.repositories.has(cacheKey)) {
      this.repositories.set(cacheKey, new SupabaseLedgerEntryRepository(this.tenantId))
    }
    
    return this.repositories.get(cacheKey)!
  }

  // Supplier Repository
  getSupplierRepository(): ISupplierRepository {
    const cacheKey = 'supplier'
    
    if (!this.repositories.has(cacheKey)) {
      this.repositories.set(cacheKey, new SupabaseSupplierRepository(this.tenantId))
    }
    
    return this.repositories.get(cacheKey)!
  }

  // Tenant Repository
  getTenantRepository(): ITenantRepository {
    const cacheKey = 'tenant'
    
    if (!this.repositories.has(cacheKey)) {
      this.repositories.set(cacheKey, new SupabaseTenantRepository())
    }
    
    return this.repositories.get(cacheKey)!
  }

  // User Repository
  getUserRepository(): IUserRepository {
    const cacheKey = 'user'
    
    if (!this.repositories.has(cacheKey)) {
      this.repositories.set(cacheKey, new SupabaseUserRepository(this.tenantId))
    }
    
    return this.repositories.get(cacheKey)!
  }

  // Domain Services
  getPricingService(): PricingService {
    return PricingService
  }

  getSalesService(): SalesService {
    return SalesService
  }

  getFinancialService(): FinancialService {
    return FinancialService
  }

  // Create all repositories at once (for initialization)
  createAllRepositories() {
    return {
      customerRepository: this.getCustomerRepository(),
      productRepository: this.getProductRepository(),
      saleRepository: this.getSaleRepository(),
      inventoryMovementRepository: this.getInventoryMovementRepository(),
      ledgerEntryRepository: this.getLedgerEntryRepository(),
      supplierRepository: this.getSupplierRepository(),
      tenantRepository: this.getTenantRepository(),
      userRepository: this.getUserRepository(),
      // Domain services
      pricingService: this.getPricingService(),
      salesService: this.getSalesService(),
      financialService: this.getFinancialService()
    }
  }

  // Create repository package for ServiceFactory
  createServicePackage() {
    const ledgerRepository = this.getLedgerEntryRepository()
    
    return {
      customerRepository: this.getCustomerRepository(),
      productRepository: this.getProductRepository(),
      saleRepository: this.getSaleRepository(),
      inventoryRepository: this.getInventoryMovementRepository(),
      ledgerRepository,
      supplierRepository: this.getSupplierRepository(),
      // Domain services
      pricingService: this.getPricingService(),
      salesService: this.getSalesService(),
      financialService: this.getFinancialService()
    }
  }

  // Clear cache for testing or tenant isolation
  clearCache(): void {
    this.repositories.clear()
  }

  // Clear specific repository cache
  clearRepositoryCache(repositoryName: string): void {
    this.repositories.delete(repositoryName)
  }

  // Get tenant ID
  getTenantId(): string {
    return this.tenantId
  }

  // Factory methods for specific use cases

  // Factory for POS operations (point of sale)
  createPOSFactory() {
    return {
      customerRepository: this.getCustomerRepository(),
      productRepository: this.getProductRepository(),
      saleRepository: this.getSaleRepository(),
      inventoryMovementRepository: this.getInventoryMovementRepository(),
      ledgerEntryRepository: this.getLedgerEntryRepository(),
      pricingService: this.getPricingService(),
      salesService: this.getSalesService()
    }
  }

  // Factory for inventory management
  createInventoryFactory() {
    return {
      productRepository: this.getProductRepository(),
      inventoryMovementRepository: this.getInventoryMovementRepository(),
      supplierRepository: this.getSupplierRepository(),
      ledgerEntryRepository: this.getLedgerEntryRepository()
    }
  }

  // Factory for financial operations
  createFinancialFactory() {
    const ledgerRepository = this.getLedgerEntryRepository()
    const customerRepository = this.getCustomerRepository()
    const supplierRepository = this.getSupplierRepository()
    
    return {
      ledgerRepository,
      customerRepository,
      supplierRepository,
      financialService: this.getFinancialService()
    }
  }

  // Factory for reporting operations
  createReportingFactory() {
    return {
      customerRepository: this.getCustomerRepository(),
      productRepository: this.getProductRepository(),
      saleRepository: this.getSaleRepository(),
      inventoryMovementRepository: this.getInventoryMovementRepository(),
      ledgerEntryRepository: this.getLedgerEntryRepository(),
      supplierRepository: this.getSupplierRepository()
    }
  }

  // Static factory methods for common patterns

  // Create factory for tenant initialization
  static createForTenantSetup(tenantId: string) {
    const factory = new RepositoryFactory(tenantId)
    
    return {
      tenantRepository: factory.getTenantRepository(),
      userRepository: factory.getUserRepository()
    }
  }

  // Create factory for user operations
  static createForUserOperations(tenantId: string) {
    const factory = new RepositoryFactory(tenantId)
    
    return {
      userRepository: factory.getUserRepository(),
      tenantRepository: factory.getTenantRepository()
    }
  }

  // Create factory with custom repository implementations (for testing)
  static createWithCustomRepositories(
    tenantId: string,
    customRepositories: Partial<Record<string, any>>
  ) {
    const factory = new RepositoryFactory(tenantId)
    
    // Override with custom implementations
    Object.entries(customRepositories).forEach(([key, repository]) => {
      factory.repositories.set(key, repository)
    })
    
    return factory
  }

  // Health check method
  async healthCheck(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    
    try {
      // Test basic connectivity
      const customerRepo = this.getCustomerRepository()
      await customerRepo.findByTenantId({ page: 1, limit: 1 })
      results.customer = true
    } catch (error) {
      results.customer = false
    }
    
    try {
      const productRepo = this.getProductRepository()
      await productRepo.findByTenantId({ page: 1, limit: 1 })
      results.product = true
    } catch (error) {
      results.product = false
    }
    
    return results
  }

  // Cleanup method for tenant deletion
  cleanup(): void {
    this.clearCache()
    RepositoryFactory.instances.delete(this.tenantId)
  }
}

// Export factory types for better type safety
export type RepositoryPackage = ReturnType<RepositoryFactory['createServicePackage']>
export type POSPackage = ReturnType<RepositoryFactory['createPOSFactory']>
export type InventoryPackage = ReturnType<RepositoryFactory['createInventoryFactory']>
export type FinancialPackage = ReturnType<RepositoryFactory['createFinancialFactory']>
export type ReportingPackage = ReturnType<RepositoryFactory['createReportingFactory']>