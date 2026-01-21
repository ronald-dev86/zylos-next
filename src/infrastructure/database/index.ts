// Infrastructure database repositories exports
// Clean Architecture - Database Layer

// Base Service
export { BaseService } from './client/BaseService'

// Base Repository
export { BaseRepository } from './repositories/base/BaseRepository'

// Core Repositories
export { SupabaseTenantRepository } from './repositories/implementations/SupabaseTenantRepository'
export { SupabaseUserRepository } from './repositories/implementations/SupabaseUserRepository'
export { SupabaseCustomerRepository } from './repositories/implementations/SupabaseCustomerRepository'
export { SupabaseSupplierRepository } from './repositories/implementations/SupabaseSupplierRepository'
export { SupabaseProductRepository } from './repositories/implementations/SupabaseProductRepository'

// Business Repositories
export { SupabaseInventoryMovementRepository } from './repositories/implementations/SupabaseInventoryMovementRepository'
export { SupabaseLedgerEntryRepository } from './repositories/implementations/SupabaseLedgerEntryRepository'
export { SupabaseSaleRepository, type ISaleRepository, type Sale, type SaleLineItem, type CreateSaleData } from './repositories/implementations/SupabaseSaleRepository'