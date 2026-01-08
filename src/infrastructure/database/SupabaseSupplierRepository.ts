import { ISupplierRepository } from '@/core/services/ISupplierRepository'
import { Supplier } from '@/core/entities/Supplier'
import { BaseService } from './BaseService'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseSupplierRepository extends BaseService implements ISupplierRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  async create(supplier: {
    name: string
    email?: string
    phone?: string
    address?: string
  }): Promise<Supplier> {
    const { data, error } = await this.withTenantFilter()
      .from('suppliers')
      .insert([{
        name: supplier.name,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address
      }])
      .select()

    if (error) throw new Error(`Failed to create supplier: ${error.message}`)
    if (!data || data.length === 0) throw new Error('No data returned from supplier creation')

    return this.mapToSupplier(data[0])
  }

  async findById(id: string): Promise<Supplier | null> {
    const { data, error } = await this.withTenantFilter()
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .limit(1)

    if (error) throw new Error(`Failed to find supplier: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToSupplier(data[0])
  }

  async findByEmail(email: string): Promise<Supplier | null> {
    const { data, error } = await this.withTenantFilter()
      .from('suppliers')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) throw new Error(`Failed to find supplier by email: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToSupplier(data[0])
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Supplier>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('suppliers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find suppliers by tenant: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToSupplier),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async update(id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Supplier> {
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
      .from('suppliers')
      .update(updateData)
      .eq('id', id)
      .select()

    if (error) throw new Error(`Failed to update supplier: ${error.message}`)
    if (!updatedData || updatedData.length === 0) throw new Error('No data returned from supplier update')

    return this.mapToSupplier(updatedData[0])
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.withTenantFilter()
      .from('suppliers')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Failed to delete supplier: ${error.message}`)
  }

  async searchByName(name: string, pagination: PaginationParams): Promise<PaginatedResponse<Supplier>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('suppliers')
      .select('*', { count: 'exact' })
      .ilike('name', `%${name}%`)
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to search suppliers by name: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToSupplier),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  private mapToSupplier(data: Database['public']['Tables']['suppliers']['Row']): Supplier {
    return new Supplier({
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