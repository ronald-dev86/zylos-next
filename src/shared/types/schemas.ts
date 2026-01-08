import { z } from 'zod'

// =============================================================================
// ENTITY SCHEMAS - Validación de datos de entrada
// =============================================================================

export const TenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, 'Business name is required (min 3 characters)').max(100, 'Business name too long (max 100)'),
  subdomain: z.string().min(1, 'Subdomain is required').max(50, 'Subdomain too long (max 50)').regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens'),
  active: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email format'),
  tenant_id: z.string().uuid('Invalid tenant ID'),
  role: z.enum(['super_admin', 'admin', 'vendedor', 'contador']),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const ProductSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1, 'Product name is required').max(200, 'Product name too long (max 200)'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long (max 50)'),
  price: z.number().min(0, 'Price must be non-negative').max(999999.99, 'Price too high'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const InventoryMovementSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  product_id: z.string().uuid(),
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().positive('Quantity must be greater than 0').max(999999.999, 'Quantity too high'),
  reason: z.string().optional(),
  reference_id: z.string().uuid().optional(),
  created_at: z.string().datetime()
})

export const CustomerSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1, 'Customer name is required').max(100, 'Customer name too long (max 100)'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().regex(/^[+]?[\d\s\-\(\)]+$/, 'Invalid phone format').optional(),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long (max 500)').optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const SupplierSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  name: z.string().min(1, 'Supplier name is required').max(100, 'Supplier name too long (max 100)'),
  email: z.string().email('Invalid email format').optional(),
  phone: z.string().regex(/^[+]?[\d\s\-\(\)]+$/, 'Invalid phone format').optional(),
  address: z.string().min(1, 'Address is required').max(500, 'Address too long (max 500)').optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const LedgerEntrySchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  entity_type: z.enum(['customer', 'supplier']),
  entity_id: z.string().uuid(),
  type: z.enum(['credit', 'debit']),
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(999999.99, 'Amount too high'),
  description: z.string().optional(),
  reference_id: z.string().uuid().optional(),
  created_at: z.string().datetime()
})

// =============================================================================
// CRUD SCHEMAS - Para creación y actualización con validación de negocio
// =============================================================================

export const CreateTenantSchema = TenantSchema.omit({ id: true, created_at: true, updated_at: true }).extend({
  name: z.string().min(3, 'Business name is required (min 3 characters)').max(100, 'Business name too long (max 100)'),
  subdomain: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/).refine(
    (val) => !['api', 'admin', 'www', 'mail', 'ftp', 'cdn'].includes(val),
    'Subdomain is reserved'
  )
})

export const UpdateTenantSchema = TenantSchema.omit({ id: true, created_at: true }).partial()

export const CreateUserSchema = UserSchema.omit({ id: true, created_at: true, updated_at: true }).extend({
  password: z.string().min(8, 'Password must be at least 8 characters')
})

export const UpdateUserSchema = UserSchema.omit({ id: true, created_at: true, tenant_id: true }).partial()

export const CreateProductSchema = ProductSchema.omit({ id: true, created_at: true, updated_at: true }).extend({
  sku: z.string().min(1).max(50)
})

export const UpdateProductSchema = ProductSchema.omit({ id: true, created_at: true, tenant_id: true }).partial()

export const CreateCustomerSchema = CustomerSchema.omit({ id: true, created_at: true, updated_at: true }).extend({
  email: z.string().email().optional()
})

export const UpdateCustomerSchema = CustomerSchema.omit({ id: true, created_at: true, tenant_id: true }).partial()

export const CreateSupplierSchema = SupplierSchema.omit({ id: true, created_at: true, updated_at: true })
export const UpdateSupplierSchema = SupplierSchema.omit({ id: true, created_at: true, tenant_id: true }).partial()

export const CreateInventoryMovementSchema = InventoryMovementSchema.omit({ id: true, created_at: true, tenant_id: true }).extend({
  type: z.enum(['in', 'out', 'adjustment']),
  quantity: z.number().positive('Quantity must be greater than 0')
})

export const CreateLedgerEntrySchema = LedgerEntrySchema.omit({ id: true, created_at: true, tenant_id: true }).extend({
  amount: z.number().min(0.01, 'Amount must be greater than 0')
})

export const UpdateLedgerEntrySchema = LedgerEntrySchema.omit({ id: true, created_at: true, tenant_id: true }).partial()

// =============================================================================
// BUSINESS SCHEMAS - Para operaciones complejas
// =============================================================================

export const SaleTransactionSchema = z.object({
  customer_id: z.string().uuid('Customer ID is required'),
  items: z.array(z.object({
    product_id: z.string().uuid('Product ID is required'),
    quantity: z.number().positive('Quantity must be greater than 0').max(1000, 'Quantity too high'),
    unit_price: z.number().min(0, 'Unit price must be non-negative').max(999999.99, 'Unit price too high')
  })).min(1, 'At least one item is required').max(100, 'Too many items'),
  payment_method: z.enum(['cash', 'credit', 'mixed']).default('credit'),
  notes: z.string().max(1000, 'Notes too long (max 1000)').optional()
})

export const PaymentSchema = z.object({
  entity_type: z.enum(['customer', 'supplier']),
  entity_id: z.string().uuid('Entity ID is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0').max(999999.99, 'Amount too high'),
  description: z.string().max(500, 'Description too long (max 500)').optional(),
  payment_method: z.enum(['cash', 'transfer', 'check', 'card']).default('cash'),
  reference_number: z.string().max(100, 'Reference number too long (max 100)').optional()
})

// =============================================================================
// AUTHENTICATION SCHEMAS
// =============================================================================

export const LoginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long (max 128 characters)'),
  remember_me: z.boolean().default(false)
})

export const RegisterSchema = z.object({
  name: z.string()
    .min(3, 'Business name is required (min 3 characters)')
    .max(100, 'Business name too long (max 100 characters)'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long (max 128 characters)')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirm_password: z.string(),
  tenant_subdomain: z.string()
    .min(1, 'Tenant subdomain is required')
    .min(3, 'Subdomain must be at least 3 characters')
    .max(50, 'Subdomain too long (max 50 characters)')
    .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens')
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
})

export const ForgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email format')
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long (max 128 characters)')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirm_password: z.string()
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"]
})

// =============================================================================
// QUERY SCHEMAS - Para filtros y paginación
// =============================================================================

export const ProductQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  min_price: z.number().min(0).optional(),
  max_price: z.number().min(0).optional(),
  in_stock: z.boolean().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

export const CustomerQuerySchema = z.object({
  search: z.string().optional(),
  has_credit: z.boolean().optional(),
  balance_min: z.number().optional(),
  balance_max: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

export const SupplierQuerySchema = z.object({
  search: z.string().optional(),
  has_debt: z.boolean().optional(),
  balance_min: z.number().optional(),
  balance_max: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

export const LedgerQuerySchema = z.object({
  entity_type: z.enum(['customer', 'supplier']).optional(),
  entity_id: z.string().uuid().optional(),
  type: z.enum(['credit', 'debit']).optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  min_amount: z.number().min(0).optional(),
  max_amount: z.number().min(0).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50)
})

// =============================================================================
// BUSINESS RESPONSE SCHEMAS - Para operaciones específicas del dominio
// =============================================================================

export const RegistrationSummarySchema = z.object({
  tenant: TenantSchema.nullable(),
  userCount: z.number().min(0).default(0),
  canAccess: z.boolean().default(false)
})

// =============================================================================
// RESPONSE SCHEMAS - Para respuestas estandarizadas
// =============================================================================

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional(),
  total: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional()
})

export const PaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean()
})

// =============================================================================
// TYPES EXPORT
// =============================================================================

export type Tenant = z.infer<typeof TenantSchema>
export type User = z.infer<typeof UserSchema>
export type Product = z.infer<typeof ProductSchema>
export type InventoryMovement = z.infer<typeof InventoryMovementSchema>
export type Customer = z.infer<typeof CustomerSchema>
export type Supplier = z.infer<typeof SupplierSchema>
export type LedgerEntry = z.infer<typeof LedgerEntrySchema>

export type CreateTenant = z.infer<typeof CreateTenantSchema>
export type UpdateTenant = z.infer<typeof UpdateTenantSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
export type CreateProduct = z.infer<typeof CreateProductSchema>
export type UpdateProduct = z.infer<typeof UpdateProductSchema>
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>
export type CreateSupplier = z.infer<typeof CreateSupplierSchema>
export type UpdateSupplier = z.infer<typeof UpdateSupplierSchema>
export type CreateInventoryMovement = z.infer<typeof CreateInventoryMovementSchema>
export type CreateLedgerEntry = z.infer<typeof CreateLedgerEntrySchema>

export type SaleTransaction = z.infer<typeof SaleTransactionSchema>
export type Payment = z.infer<typeof PaymentSchema>

export type Login = z.infer<typeof LoginSchema>
export type Register = z.infer<typeof RegisterSchema>
export type ForgotPassword = z.infer<typeof ForgotPasswordSchema>
export type ResetPassword = z.infer<typeof ResetPasswordSchema>

export type ProductQuery = z.infer<typeof ProductQuerySchema>
export type CustomerQuery = z.infer<typeof CustomerQuerySchema>
export type SupplierQuery = z.infer<typeof SupplierQuerySchema>
export type LedgerQuery = z.infer<typeof LedgerQuerySchema>

export type RegistrationSummary = z.infer<typeof RegistrationSummarySchema>

export type ApiResponse<T> = z.infer<typeof ApiResponseSchema> & {
  data?: T
}
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>