import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/shared/types/database'

export class BaseService {
  protected supabase: SupabaseClient<Database>
  protected tenantId?: string

  constructor(tenantId?: string) {
    this.tenantId = tenantId
    
    // Client with RLS enforcement - will be automatically filtered by tenant_id
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: tenantId ? {
            'x-tenant-id': tenantId
          } : undefined
        }
      }
    )
  }

  // Helper to ensure tenant isolation in queries
  protected withTenantFilter() {
    if (!this.tenantId) {
      throw new Error('Tenant context is required for this operation')
    }
    return this.supabase
  }

  // Create admin client for tenant management operations
  protected static createAdminClient(): SupabaseClient<Database> {
    return createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  // Method to execute RPC functions with tenant context
  protected async rpc<T = any>(
    functionName: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    const { data, error } = await this.withTenantFilter()
      .rpc(functionName, {
        ...params,
        p_tenant_id: this.tenantId!
      })

    if (error) {
      throw new Error(`RPC function ${functionName} failed: ${error.message}`)
    }

    return data as T
  }
}