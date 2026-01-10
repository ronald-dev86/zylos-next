import { Tenant } from '../entities/Tenant'

export interface ITenantRepository {
  create(tenant: {
    name: string
    subdomain: string
  }): Promise<Tenant>
  findById(id: string): Promise<Tenant | null>
  findBySubdomain(subdomain: string): Promise<Tenant | null>
  update(id: string, data: Partial<Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Tenant>
  delete(id: string): Promise<void>
  findAll(): Promise<Tenant[]>
}