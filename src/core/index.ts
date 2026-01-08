// Core entities
export { Tenant } from './entities/Tenant'
export { User } from './entities/User'
export { Product } from './entities/Product'
export { Customer } from './entities/Customer'
export { Supplier } from './entities/Supplier'
export { InventoryMovement } from './entities/InventoryMovement'
export { LedgerEntry } from './entities/LedgerEntry'

// Domain values and enums
export {
  UserRole,
  EntityType,
  MovementType,
  LedgerType,
  Money,
  Email,
  Subdomain,
  SKU
} from './domain'

// Core services (use cases)
export { TenantService } from './use-cases/TenantService'
export { UserService } from './use-cases/UserService'
export { ProductService } from './use-cases/ProductService'
export { CustomerService } from './use-cases/CustomerService'
export { SupplierService } from './use-cases/SupplierService'
export { InventoryService } from './use-cases/InventoryService'
export { LedgerService } from './use-cases/LedgerService'

// Application services (high-level orchestration)
export { ApplicationService, type TenantContext } from './application/ApplicationService'
export { ServiceFactory } from './application/ServiceFactory'

// Core interfaces (repositories)
export type { ITenantRepository } from './services/ITenantRepository'
export type { IUserRepository } from './services/IUserRepository'
export type { IProductRepository } from './services/IProductRepository'
export type { ICustomerRepository } from './services/ICustomerRepository'
export type { ISupplierRepository } from './services/ISupplierRepository'
export type { IInventoryMovementRepository } from './services/IInventoryMovementRepository'
export type { ILedgerEntryRepository } from './services/ILedgerEntryRepository'