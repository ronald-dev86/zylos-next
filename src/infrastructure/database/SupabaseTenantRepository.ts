import { ITenantRepository } from '@/core/services/ITenantRepository'
import { Tenant } from '@/core/entities/Tenant'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/shared/types/database'

export class SupabaseTenantRepository implements ITenantRepository {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async create(tenant: {
    name: string
    subdomain: string
  }): Promise<Tenant> {
    const { data, error } = await this.supabase
      .from('tenants')
      .insert([{
        name: tenant.name,
        subdomain: tenant.subdomain
      }])
      .select()

    if (error) throw new Error(`Failed to create tenant: ${error.message}`)
    if (!data || data.length === 0) throw new Error('No data returned from tenant creation')

    return this.mapToTenant(data[0])
  }

  async findById(id: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (error) throw new Error(`Failed to find tenant: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToTenant(data[0])
  }

  async findBySubdomain(subdomain: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain)
      .limit(1)

    if (error) throw new Error(`Failed to find tenant by subdomain: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToTenant(data[0])
  }

  async update(id: string, data: { name?: string; subdomain?: string }): Promise<Tenant> {
    const updateData = {
      name: data.name,
      subdomain: data.subdomain,
      updated_at: new Date().toISOString()
    }
    
    const { data: updatedData, error } = await this.supabase
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw new Error(`Failed to update tenant: ${error.message}`)
    if (!updatedData || updatedData.length === 0) throw new Error('No data returned from tenant update')

    return this.mapToTenant(updatedData[0])
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('tenants')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete tenant: ${error.message}`)
  }

  async findAll(): Promise<Tenant[]> {
    const { data, error } = await this.supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch tenants: ${error.message}`)
    if (!data) return []

    return data.map(this.mapToTenant)
  }

  private mapToTenant(data: Database['public']['Tables']['tenants']['Row']): Tenant {
    return new Tenant({
      id: data.id,
      name: data.name,
      subdomain: data.subdomain,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }
}