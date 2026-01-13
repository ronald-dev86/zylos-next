import { ISupplierRepository } from '@/core/services/ISupplierRepository'
import { Supplier } from '@/core/entities/Supplier'
import { BaseRepository } from './BaseRepository'
import { Database } from '@/shared/types/database'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupabaseSupplierRepository extends BaseRepository<Supplier> implements ISupplierRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  protected mapToEntity(data: any): Supplier {
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

  protected getTableName(): string {
    return 'suppliers'
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
      .single()

    if (error) throw new Error(`Failed to create supplier: ${error.message}`)
    return this.mapToEntity(data)
  }

  async findById(id: string): Promise<Supplier | null> {
    return await this.findByIdInternal(id)
  }

  async findByEmail(email: string): Promise<Supplier | null> {
    const { data, error } = await this.withTenantFilter()
      .from('suppliers')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) throw new Error(`Failed to find supplier by email: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToEntity(data[0])
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Supplier>> {
    const query = this.withTenantFilter()
      .from('suppliers')
      .select('*')
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async update(id: string, data: Partial<Omit<Supplier, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<Supplier> {
    const { data: updatedData, error } = await this.withTenantFilter()
      .from('suppliers')
      .update({
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update supplier: ${error.message}`)
    return this.mapToEntity(updatedData)
  }

  async delete(id: string): Promise<void> {
    await this.deleteInternal(id)
  }

  async searchByName(name: string, pagination: PaginationParams): Promise<PaginatedResponse<Supplier>> {
    return await this.searchByNameInternal(name, pagination)
  }
}