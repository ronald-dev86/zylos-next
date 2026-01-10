export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          subdomain: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          subdomain: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          subdomain?: string
          active?: boolean
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: Record<string, any>
    Enums: {
      tenant_role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export interface Tenant {
  id: string
  name: string
  subdomain: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  tenant_id: string
  role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  created_at: string
  updated_at: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    tenant?: Tenant
    auth: {
      token: string
      refreshToken: string
      expiresAt: string | null
      type: string
    }
  }
  error?: string
  code?: string
}