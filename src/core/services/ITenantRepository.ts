import { Tenant } from '@/core/entities/Tenant'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface ITenantRepository {
  create(tenant: {
    name: string
    subdomain: string
  }): Promise<Tenant>
  findById(id: string): Promise<Tenant | null>
  findBySubdomain(subdomain: string): Promise<Tenant | null>
  findAll(pagination: PaginationParams): Promise<PaginatedResponse<Tenant>>
  update(id: string, data: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tenant>
  activate(id: string): Promise<Tenant>
  deactivate(id: string): Promise<Tenant>
}