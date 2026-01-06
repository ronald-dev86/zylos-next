export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          subdomain: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          tenant_id: string
          role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          tenant_id: string
          role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          tenant_id?: string
          role?: 'super_admin' | 'admin' | 'vendedor' | 'contador'
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          tenant_id: string
          name: string
          description?: string
          sku: string
          price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          description?: string
          sku: string
          price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          description?: string
          sku?: string
          price?: number
          updated_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          tenant_id: string
          product_id: string
          type: 'in' | 'out' | 'adjustment'
          quantity: number
          reason?: string
          reference_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          product_id: string
          type: 'in' | 'out' | 'adjustment'
          quantity: number
          reason?: string
          reference_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          product_id?: string
          type?: 'in' | 'out' | 'adjustment'
          quantity?: number
          reason?: string
          reference_id?: string
        }
      }
      customers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          email?: string
          phone?: string
          address?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          email?: string
          phone?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          updated_at?: string
        }
      }
      suppliers: {
        Row: {
          id: string
          tenant_id: string
          name: string
          email?: string
          phone?: string
          address?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          email?: string
          phone?: string
          address?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          email?: string
          phone?: string
          address?: string
          updated_at?: string
        }
      }
      ledger_entries: {
        Row: {
          id: string
          tenant_id: string
          entity_type: 'customer' | 'supplier'
          entity_id: string
          type: 'credit' | 'debit'
          amount: number
          description?: string
          reference_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          entity_type: 'customer' | 'supplier'
          entity_id: string
          type: 'credit' | 'debit'
          amount: number
          description?: string
          reference_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          entity_type?: 'customer' | 'supplier'
          entity_id?: string
          type?: 'credit' | 'debit'
          amount?: number
          description?: string
          reference_id?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}