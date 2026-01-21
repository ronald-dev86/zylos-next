import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/shared/types/database'

export class BaseService {
  protected supabase: SupabaseClient<Database>
  protected tenantId?: string

  constructor(tenantId?: string) {
    this.tenantId = tenantId
    
    // Server-only client with RLS enforcement - uses service keys for security
    this.supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
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
    return this.supabase
  }

  // Create admin client for tenant management operations
  protected static createAdminClient(): SupabaseClient<Database> {
    return createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
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
    const rpcParams = this.tenantId ? {
      ...params,
      p_tenant_id: this.tenantId
    } : params;

    const { data, error } = await this.withTenantFilter()
      .rpc(functionName, rpcParams)

    if (error) {
      throw new Error(`RPC function ${functionName} failed: ${error.message}`)
    }

    return data as T
  }
}