import { Tenant } from '../entities/Tenant'
import { ITenantRepository } from '../services/ITenantRepository'

export class TenantService {
  constructor(private tenantRepository: ITenantRepository) {}

  async createTenant(name: string, subdomain: string): Promise<Tenant> {
    // Check if subdomain already exists
    const existingTenant = await this.tenantRepository.findBySubdomain(subdomain)
    if (existingTenant) {
      throw new Error('Subdomain already exists')
    }

    const tenantData = Tenant.create(name, subdomain)
    return await this.tenantRepository.create(tenantData)
  }

  async getTenantById(id: string): Promise<Tenant | null> {
    return await this.tenantRepository.findById(id)
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    return await this.tenantRepository.findBySubdomain(subdomain)
  }

  async updateTenant(id: string, data: { name?: string; subdomain?: string }): Promise<Tenant> {
    // If updating subdomain, check if it already exists
    if (data.subdomain) {
      const existingTenant = await this.tenantRepository.findBySubdomain(data.subdomain)
      if (existingTenant && existingTenant.id !== id) {
        throw new Error('Subdomain already exists')
      }
    }

    return await this.tenantRepository.update(id, data)
  }

  async deleteTenant(id: string): Promise<void> {
    // Add business logic for tenant deletion
    // e.g., check if tenant has users, products, etc.
    await this.tenantRepository.delete(id)
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await this.tenantRepository.findAll()
  }
}