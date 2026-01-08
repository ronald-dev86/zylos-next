import { ICustomerRepository } from '@/core/services/ICustomerRepository'
import { Customer } from '@/core/entities/Customer'
import { BaseService } from './BaseService'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseCustomerRepository extends BaseService implements ICustomerRepository {
  constructor(tenantId: string) {
    super(tenantId)
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

    return this.mapToCustomer(data[0])
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await this.withTenantFilter()
      .from('customers')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (error) throw new Error(`Failed to find customer: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToCustomer(data[0])
  }

  async findByEmail(email: string): Promise<Customer | null> {
    const { data, error } = await this.withTenantFilter()
      .from('customers')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) throw new Error(`Failed to find customer by email: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToCustomer(data[0])
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Customer>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find customers by tenant: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToCustomer),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async update(id: string, data: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Customer> {
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

    return this.mapToCustomer(updatedData[0])
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.withTenantFilter()
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete customer: ${error.message}`)
  }

  async searchByName(name: string, pagination: PaginationParams): Promise<PaginatedResponse<Customer>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('customers')
      .select('*', { count: 'exact' })
      .ilike('name', `%${name}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to search customers by name: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToCustomer),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  private mapToCustomer(data: Database['public']['Tables']['customers']['Row']): Customer {
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
}