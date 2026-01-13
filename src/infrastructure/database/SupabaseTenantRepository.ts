import { ITenantRepository } from '@/core/services/ITenantRepository'
import { Tenant } from '@/core/entities/Tenant'
import { BaseRepository } from './BaseRepository'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseTenantRepository extends BaseRepository<Tenant> implements ITenantRepository {
  constructor() {
    super('') // Tenant operations don't require tenant context
  }

  protected mapToEntity(data: any): Tenant {
    return new Tenant({
      id: data.id,
      name: data.name,
      subdomain: data.subdomain,
      active: data.active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }

  protected getTableName(): string {
    return 'tenants'
  }

async create(tenant: {
    name: string
    subdomain: string
  }): Promise<Tenant> {
    const adminClient = SupabaseTenantRepository.createAdminClient()
    
    const { data, error } = await adminClient
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

  async findAll(pagination: PaginationParams): Promise<PaginatedResponse<Tenant>> {
    const query = this.supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async activate(id: string): Promise<Tenant> {
    const { data, error } = await this.supabase
      .from('tenants')
      .update({ 
        active: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to activate tenant: ${error.message}`)
    return this.mapToEntity(data)
  }

  async deactivate(id: string): Promise<Tenant> {
    const { data, error } = await this.supabase
      .from('tenants')
      .update({ 
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to deactivate tenant: ${error.message}`)
    return this.mapToEntity(data)
  }

  private mapToTenant(data: Database['public']['Tables']['tenants']['Row']): Tenant {
    return this.mapToEntity(data)
  }
}