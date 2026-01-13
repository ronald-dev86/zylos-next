import { IUserRepository } from '@/core/services/IUserRepository'
import { User } from '@/core/entities/User'
import { BaseRepository } from './BaseRepository'
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

  async findByTenantId(): Promise<User[]> {
    const { data, error } = await this.withTenantFilter()
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to find users by tenant: ${error.message}`)
    if (!data) return []

    return data.map((item: any) => this.mapToEntity(item))
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<User> {
    const { data: updatedData, error } = await this.withTenantFilter()
      .from('users')
      .update({
        email: data.email,
        role: data.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update user: ${error.message}`)
    return this.mapToEntity(updatedData)
  }

  async delete(id: string): Promise<void> {
    await this.deleteInternal(id)
  }

  async updateRole(id: string, role: 'super_admin' | 'admin' | 'vendedor' | 'contador'): Promise<User> {
    const { data, error } = await this.withTenantFilter()
      .from('users')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update user role: ${error.message}`)
    return this.mapToEntity(data)
  }
}