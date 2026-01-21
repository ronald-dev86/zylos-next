import { IUserRepository } from '@/core/services/IUserRepository'
import { User } from '@/core/entities/User'
import { BaseRepository } from '../base/BaseRepository'
import { Database } from '@/shared/types/database'

export class SupabaseUserRepository extends BaseRepository<User> implements IUserRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  protected mapToEntity(data: any): User {
    return new User({
      id: data.id,
      email: data.email,
      tenantId: data.tenant_id,
      role: data.role,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }

  protected getTableName(): string {
    return 'users'
  }

  async create(user: {
    email: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  }): Promise<User> {
    if (!this.tenantId) {
      throw new Error('Tenant ID is required to create user')
    }
    
    const { data, error } = await this.withTenantFilter()
      .from('users')
      .insert([{
        email: user.email,
        tenant_id: this.tenantId,
        role: user.role
      }])
      .select()
      .single()

    if (error) throw new Error(`Failed to create user: ${error.message}`)
    return this.mapToEntity(data)
  }

  async findById(id: string): Promise<User | null> {
    return await this.findByIdInternal(id)
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.withTenantFilter()
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) throw new Error(`Failed to find user by email: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToEntity(data[0])
  }

  async findByTenantId(tenantId?: string): Promise<User[]> {
    let query;
    
    if (tenantId) {
      query = this.supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId);
    } else {
      query = this.withTenantFilter()
        .from('users')
        .select('*');
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to find users by tenant: ${error.message}`)
    if (!data) return []

    return data.map((item: any) => this.mapToEntity(item))
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<User> {
    const query = this.withTenantFilter()
      .from('users')
      .update({
        email: data.email,
        role: data.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      
    // Only add tenant filter if tenantId is available
    if (this.tenantId) {
      query.eq('tenant_id', this.tenantId)
    }
    
    const { data: updatedData, error } = await query.select().single()

    if (error) throw new Error(`Failed to update user: ${error.message}`)
    return this.mapToEntity(updatedData)
  }

  async delete(id: string): Promise<void> {
    if (!this.tenantId) {
      throw new Error('Tenant ID is required to delete user')
    }
    await this.deleteInternal(id)
  }

  async updateRole(id: string, role: 'super_admin' | 'admin' | 'vendedor' | 'contador'): Promise<User> {
    if (!this.tenantId) {
      throw new Error('Tenant ID is required to update user role')
    }
    
    const { data, error } = await this.withTenantFilter()
      .from('users')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update user role: ${error.message}`)
    return this.mapToEntity(data)
  }
}