import { IUserRepository } from '@/core/services/IUserRepository'
import { User } from '@/core/entities/User'
import { BaseService } from './BaseService'
import { Database } from '@/shared/types/database'

export class SupabaseUserRepository extends BaseService implements IUserRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  async create(user: {
    email: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  }): Promise<User> {
    const { data, error } = await this.withTenantFilter()
      .from('users')
      .insert([{
        email: user.email,
        tenant_id: this.tenantId,
        role: user.role
      }])
      .select()

    if (error) throw new Error(`Failed to create user: ${error.message}`)
    if (!data || data.length === 0) throw new Error('No data returned from user creation')

    return this.mapToUser(data[0])
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (error) throw new Error(`Failed to find user: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToUser(data[0])
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) throw new Error(`Failed to find user by email: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToUser(data[0])
  }

  async findByTenantId(): Promise<User[]> {
    const { data, error } = await this.withTenantFilter()
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to find users by tenant: ${error.message}`)
    if (!data) return []

    return data.map(this.mapToUser)
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User> {
    const updateData = {
      email: data.email,
      tenant_id: data.tenantId,
      role: data.role,
      updated_at: new Date().toISOString()
    }
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const { data: updatedData, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw new Error(`Failed to update user: ${error.message}`)
    if (!updatedData || updatedData.length === 0) throw new Error('No data returned from user update')

    return this.mapToUser(updatedData[0])
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete user: ${error.message}`)
  }

  async updateRole(id: string, role: 'super_admin' | 'admin' | 'vendedor' | 'contador'): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()

    if (error) throw new Error(`Failed to update user role: ${error.message}`)
    if (!data || data.length === 0) throw new Error('No data returned from user role update')

    return this.mapToUser(data[0])
  }

  private mapToUser(data: Database['public']['Tables']['users']['Row']): User {
    return new User({
      id: data.id,
      email: data.email,
      tenantId: data.tenant_id,
      role: data.role,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }
}