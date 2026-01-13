import { ICustomerRepository } from '@/core/services/ICustomerRepository'
import { Customer } from '@/core/entities/Customer'
import { BaseRepository } from './BaseRepository'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseCustomerRepository extends BaseRepository<Customer> implements ICustomerRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  protected mapToEntity(data: any): Customer {
    return new Customer({
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }

  protected getTableName(): string {
    return 'customers'
  }

  async create(customer: {
    name: string
    email?: string
    phone?: string
    address?: string
  }): Promise<Customer> {
    const { data, error } = await this.withTenantFilter()
      .from('customers')
      .insert([{
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address
      }])
      .select()

    if (error) throw new Error(`Failed to create customer: ${error.message}`)
    if (!data || data.length === 0) throw new Error('No data returned from customer creation')

    return this.mapToEntity(data[0])
  }

  async findById(id: string): Promise<Customer | null> {
    return await this.findByIdInternal(id)
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const { data, error } = await this.withTenantFilter()
      .from('customers')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) throw new Error(`Failed to find customer by email: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToEntity(data[0])
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Customer>> {
    const query = this.withTenantFilter()
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async update(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<Customer> {
    const updateData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      updated_at: new Date().toISOString()
    }
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    const { data: updatedData, error } = await this.withTenantFilter()
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw new Error(`Failed to update customer: ${error.message}`)
    if (!updatedData || updatedData.length === 0) throw new Error('No data returned from customer update')

    return this.mapToEntity(updatedData[0])
  }

  async delete(id: string): Promise<void> {
    await this.deleteInternal(id)
  }

  async searchByName(name: string, pagination: PaginationParams): Promise<PaginatedResponse<Customer>> {
    return await this.searchByNameInternal(name, pagination)
  }
}