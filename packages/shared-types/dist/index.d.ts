export type Database = {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string;
                    name: string;
                    subdomain: string;
                    active: boolean;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    subdomain: string;
                    active?: boolean;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    name?: string;
                    subdomain?: string;
                    active?: boolean;
                    updated_at?: string;
                };
            };
            users: {
                Row: {
                    id: string;
                    email: string;
                    tenant_id: string;
                    role: 'super_admin' | 'admin' | 'vendedor' | 'contador';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    tenant_id: string;
                    role: 'super_admin' | 'admin' | 'vendedor' | 'contador';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    tenant_id?: string;
                    role?: 'super_admin' | 'admin' | 'vendedor' | 'contador';
                    updated_at?: string;
                };
            };
            products: {
                Row: {
                    id: string;
                    tenant_id: string;
                    name: string;
                    description?: string;
                    sku: string;
                    price: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    name: string;
                    description?: string;
                    sku: string;
                    price: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    name?: string;
                    description?: string;
                    sku?: string;
                    price?: number;
                    updated_at?: string;
                };
            };
            customers: {
                Row: {
                    id: string;
                    tenant_id: string;
                    name: string;
                    email?: string;
                    phone?: string;
                    address?: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    name: string;
                    email?: string;
                    phone?: string;
                    address?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    name?: string;
                    email?: string;
                    phone?: string;
                    address?: string;
                    updated_at?: string;
                };
            };
            suppliers: {
                Row: {
                    id: string;
                    tenant_id: string;
                    name: string;
                    email?: string;
                    phone?: string;
                    address?: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    name: string;
                    email?: string;
                    phone?: string;
                    address?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    name?: string;
                    email?: string;
                    phone?: string;
                    address?: string;
                    updated_at?: string;
                };
            };
            sales: {
                Row: {
                    id: string;
                    tenant_id: string;
                    customer_id: string;
                    subtotal: number;
                    tax: number;
                    total_amount: number;
                    status: 'pending' | 'completed' | 'cancelled';
                    payment_status: 'pending' | 'paid' | 'partial';
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    customer_id: string;
                    subtotal?: number;
                    tax?: number;
                    total_amount?: number;
                    status?: 'pending' | 'completed' | 'cancelled';
                    payment_status?: 'pending' | 'paid' | 'partial';
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    customer_id?: string;
                    subtotal?: number;
                    tax?: number;
                    total_amount?: number;
                    status?: 'pending' | 'completed' | 'cancelled';
                    payment_status?: 'pending' | 'paid' | 'partial';
                    updated_at?: string;
                };
            };
            inventory_movements: {
                Row: {
                    id: string;
                    tenant_id: string;
                    product_id: string;
                    type: 'in' | 'out' | 'adjustment';
                    quantity: number;
                    reason?: string;
                    reference_id?: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    product_id: string;
                    type: 'in' | 'out' | 'adjustment';
                    quantity: number;
                    reason?: string;
                    reference_id?: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    product_id?: string;
                    type?: 'in' | 'out' | 'adjustment';
                    quantity?: number;
                    reason?: string;
                    reference_id?: string;
                };
            };
            ledger_entries: {
                Row: {
                    id: string;
                    tenant_id: string;
                    entity_type: 'customer' | 'supplier';
                    entity_id: string;
                    type: 'credit' | 'debit';
                    amount: number;
                    description?: string;
                    reference_id?: string;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    tenant_id: string;
                    entity_type: 'customer' | 'supplier';
                    entity_id: string;
                    type: 'credit' | 'debit';
                    amount: number;
                    description?: string;
                    reference_id?: string;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    tenant_id?: string;
                    entity_type?: 'customer' | 'supplier';
                    entity_id?: string;
                    type?: 'credit' | 'debit';
                    amount?: number;
                    description?: string;
                    reference_id?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            get_current_tenant_id: {
                Args: Record<PropertyKey, never>;
                Returns: string;
            };
            calculate_current_stock_rpc: {
                Args: {
                    p_product_id: string;
                };
                Returns: {
                    stock: number;
                };
            };
            get_tenant_products: {
                Args: Record<PropertyKey, never>;
                Returns: {
                    products: Array<{
                        id: string;
                        name: string;
                        description?: string;
                        sku: string;
                        price: number;
                        stock: number;
                        created_at: string;
                        updated_at: string;
                    }>;
                };
            };
            create_ledger_entry_rpc: {
                Args: {
                    p_entity_type: 'customer' | 'supplier';
                    p_entity_id: string;
                    p_type: 'credit' | 'debit';
                    p_amount: number;
                    p_description?: string;
                    p_reference_id?: string;
                };
                Returns: {
                    id: string;
                    created_at: string;
                };
            };
            calculate_entity_balance_rpc: {
                Args: {
                    p_entity_type: 'customer' | 'supplier';
                    p_entity_id: string;
                };
                Returns: {
                    balance: number;
                };
            };
            get_tenant_customers: {
                Args: Record<PropertyKey, never>;
                Returns: {
                    customers: Array<{
                        id: string;
                        name: string;
                        email?: string;
                        phone?: string;
                        address?: string;
                        balance: number;
                        created_at: string;
                        updated_at: string;
                    }>;
                };
            };
            get_tenant_suppliers: {
                Args: Record<PropertyKey, never>;
                Returns: {
                    suppliers: Array<{
                        id: string;
                        name: string;
                        email?: string;
                        phone?: string;
                        address?: string;
                        balance: number;
                        created_at: string;
                        updated_at: string;
                    }>;
                };
            };
            create_sale_transaction_rpc: {
                Args: {
                    p_customer_id: string;
                    p_items: Array<{
                        product_id: string;
                        quantity: number;
                        unit_price: number;
                    }>;
                    p_tax?: number;
                };
                Returns: {
                    id: string;
                    created_at: string;
                    items: Array<{
                        product_id: string;
                        product_name: string;
                        quantity: number;
                        unit_price: number;
                        total_price: number;
                    }>;
                    subtotal: number;
                    tax: number;
                    total_amount: number;
                };
            };
            get_sales: {
                Args: {
                    p_limit?: number;
                    p_offset?: number;
                };
                Returns: {
                    sales: Array<{
                        id: string;
                        customer_id: string;
                        customer_name?: string;
                        subtotal: number;
                        tax: number;
                        total_amount: number;
                        status: 'pending' | 'completed' | 'cancelled';
                        payment_status: 'pending' | 'paid' | 'partial';
                        created_at: string;
                        updated_at: string;
                    }>;
                };
            };
            get_sales_summary_rpc: {
                Args: {
                    p_start_date?: string;
                    p_end_date?: string;
                };
                Returns: {
                    total_sales: number;
                    total_revenue: number;
                    total_items: number;
                    start_date: string;
                    end_date: string;
                };
            };
            get_current_user_tenant: {
                Args: Record<PropertyKey, never>;
                Returns: {
                    tenant_id: string;
                    tenant_subdomain: string;
                    user_role: 'super_admin' | 'admin' | 'vendedor' | 'contador';
                };
            };
            user_has_role: {
                Args: {
                    required_role: 'super_admin' | 'admin' | 'vendedor' | 'contador';
                };
                Returns: boolean;
            };
            create_inventory_movement_rpc: {
                Args: {
                    p_product_id: string;
                    p_type: 'in' | 'out' | 'adjustment';
                    p_quantity: number;
                    p_reason?: string;
                    p_reference_id?: string;
                };
                Returns: {
                    id: string;
                    created_at: string;
                };
            };
        };
        Enums: {
            tenant_role: 'super_admin' | 'admin' | 'vendedor' | 'contador';
            entity_type: 'customer' | 'supplier';
            movement_type: 'in' | 'out' | 'adjustment';
            ledger_type: 'credit' | 'debit';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
export interface Tenant {
    id: string;
    name: string;
    subdomain: string;
    active: boolean;
    created_at: string;
    updated_at: string;
}
export interface User {
    id: string;
    email: string;
    tenant_id: string;
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador';
    created_at: string;
    updated_at: string;
}
export interface Product {
    id: string;
    tenant_id: string;
    name: string;
    description?: string;
    sku: string;
    price: number;
    stock?: number;
    created_at: string;
    updated_at: string;
}
export interface Customer {
    id: string;
    tenant_id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    balance?: number;
    created_at: string;
    updated_at: string;
}
export interface Supplier {
    id: string;
    tenant_id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    balance?: number;
    created_at: string;
    updated_at: string;
}
export interface AuthResponse {
    success: boolean;
    data?: {
        user: User;
        tenant?: Tenant;
        redirectUrl?: string;
        auth?: {
            token: string;
            refreshToken: string;
            expiresAt: string | null;
            type: string;
        };
    };
    error?: string;
    code?: string;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
}
export type UserRole = 'super_admin' | 'admin' | 'vendedor' | 'contador';
export type EntityType = 'customer' | 'supplier';
export type MovementType = 'in' | 'out' | 'adjustment';
export type LedgerType = 'credit' | 'debit';
export type SaleStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'partial';
//# sourceMappingURL=index.d.ts.map