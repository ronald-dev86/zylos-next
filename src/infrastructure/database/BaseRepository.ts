// BaseRepository - Common repository pattern to eliminate code duplication
// Provides centralized pagination, tenant filtering, and error handling

import { BaseService } from './BaseService'
import { PaginationParams, PaginatedResponse, ApiResponse } from '@/shared/types/common'

export abstract class BaseRepository<T> extends BaseService {
  constructor(tenantId: string) {
    super(tenantId)
  }

  // Abstract methods that concrete repositories must implement
  protected abstract mapToEntity(data: any): T
  protected abstract getTableName(): string

  // Centralized pagination logic
  protected async paginate(
    query: any,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    try {
      const offset = (pagination.page - 1) * pagination.limit
      
      // Get paginated data
      const { data: rawData, error } = await query
        .range(offset, offset + pagination.limit - 1)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch paginated data: ${error.message}`)
      }

      // Get total count
      const { count } = await this.supabase
        .from(this.getTableName())
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', this.tenantId!)

      const total = count || 0
      const totalPages = Math.ceil(total / pagination.limit)

      // Map to entities
      const data = rawData.map((item: any) => this.mapToEntity(item))

      return {
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
          hasNext: pagination.page < totalPages,
          hasPrev: pagination.page > 1
        }
      }
    } catch (error) {
      throw new Error(`Pagination failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Centralized single record fetch
  protected async findByIdInternal(id: string): Promise<T | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.getTableName())
        .select('*')
        .eq('id', id)
        .eq('tenant_id', this.tenantId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Record not found
        }
        throw new Error(`Failed to fetch record: ${error.message}`)
      }

      return this.mapToEntity(data)
    } catch (error) {
      throw new Error(`Find by ID failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Centralized create operation
  protected async createInternal(data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.getTableName())
        .insert({
          ...data,
          tenant_id: this.tenantId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to create record: ${error.message}`)
      }

      return this.mapToEntity(result)
    } catch (error) {
      throw new Error(`Create operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Centralized update operation
  protected async updateInternal(id: string, data: Partial<T>): Promise<T> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.getTableName())
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('tenant_id', this.tenantId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update record: ${error.message}`)
      }

      return this.mapToEntity(result)
    } catch (error) {
      throw new Error(`Update operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Centralized delete operation
  protected async deleteInternal(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.getTableName())
        .delete()
        .eq('id', id)
        .eq('tenant_id', this.tenantId)

      if (error) {
        throw new Error(`Failed to delete record: ${error.message}`)
      }
    } catch (error) {
      throw new Error(`Delete operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Centralized search by name (common pattern)
  protected async searchByNameInternal(
    name: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    try {
      const query = this.supabase
        .from(this.getTableName())
        .select('*')
        .eq('tenant_id', this.tenantId)
        .ilike('name', `%${name}%`)
        .order('created_at', { ascending: false })

      return await this.paginate(query, pagination)
    } catch (error) {
      throw new Error(`Search by name failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Centralized find by tenant
  protected async findByTenantIdInternal(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    try {
      const query = this.supabase
        .from(this.getTableName())
        .select('*')
        .eq('tenant_id', this.tenantId)
        .order('created_at', { ascending: false })

      return await this.paginate(query, pagination)
    } catch (error) {
      throw new Error(`Find by tenant failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Utility methods for concrete repositories
  protected withTenantFilterForTable() {
    return this.supabase
      .from(this.getTableName())
      .select('*')
      .eq('tenant_id', this.tenantId)
  }

  protected buildPaginationQuery(pagination: PaginationParams) {
    const offset = (pagination.page - 1) * pagination.limit
    return this.withTenantFilterForTable()
      .range(offset, offset + pagination.limit - 1)
      .order('created_at', { ascending: false })
  }

  // Error handling wrapper
  protected async handleRepositoryOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`${operationName} failed: ${message}`)
    }
  }

  // Validation helpers
  protected validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} is required`)
    }
  }

  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format')
    }
  }

  protected validateUUID(id: string): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      throw new Error('Invalid UUID format')
    }
  }

  protected validatePositiveNumber(value: number, fieldName: string): void {
    if (typeof value !== 'number' || value <= 0) {
      throw new Error(`${fieldName} must be a positive number`)
    }
  }

  protected validateNonNegativeNumber(value: number, fieldName: string): void {
    if (typeof value !== 'number' || value < 0) {
      throw new Error(`${fieldName} must be a non-negative number`)
    }
  }

  // Audit helpers
  protected addAuditMetadata(data: any, userId?: string) {
    return {
      ...data,
      tenant_id: this.tenantId,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_by: userId,
      updated_at: new Date().toISOString()
    }
  }

  protected updateAuditMetadata(data: any, userId?: string) {
    return {
      ...data,
      updated_by: userId,
      updated_at: new Date().toISOString()
    }
  }
}