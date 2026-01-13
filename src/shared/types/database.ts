// Simplified database types for compatibility
export interface Database {
  public: any
  [key: string]: any
}

// Individual table types for more specific usage
export interface UserRow {
  id: string
  email: string
  tenant_id: string
  role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  created_at: string
  updated_at: string
}

export interface TenantRow {
  id: string
  name: string
  subdomain: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerRow {
  id: string
  tenant_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  tax_id?: string
  created_at: string
  updated_at: string
}

export interface SupplierRow {
  id: string
  tenant_id: string
  name: string
  email?: string
  phone?: string
  address?: string
  tax_id?: string
  created_at: string
  updated_at: string
}

export interface ProductRow {
  id: string
  tenant_id: string
  name: string
  description?: string
  sku?: string
  price: number
  cost?: number
  stock_quantity: number
  category?: string
  created_at: string
  updated_at: string
}

export interface SaleRow {
  id: string
  tenant_id: string
  customer_id: string
  total_amount: number
  status: 'pending' | 'completed' | 'cancelled'
  payment_method?: string
  payment_status?: 'pending' | 'paid' | 'partial'
  notes?: string
  created_at: string
  updated_at: string
}

export interface InventoryMovementRow {
  id: string
  tenant_id: string
  product_id: string
  type: 'in' | 'out'
  quantity: number
  reason?: string
  reference_type?: 'sale' | 'purchase' | 'adjustment'
  reference_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface LedgerEntryRow {
  id: string
  tenant_id: string
  entity_type: string
  entity_id: string
  type: 'debit' | 'credit'
  amount: number
  description: string
  reference_id?: string
  created_at: string
  updated_at: string
}