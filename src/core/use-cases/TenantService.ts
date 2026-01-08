import { createServiceClient } from '@/lib/supabase/client'
import { ApiResponse } from '@/shared/types/schemas'
import { CreateTenant, Tenant } from '@/shared/types/schemas'
import { CreateTenantSchema } from '@/shared/types/schemas'

/**
 * Servicio de gestión de tenants
 * Responsabilidad: Únicamente la creación y gestión de tenants
 */
export class TenantService {
  private supabase = createServiceClient()

  /**
   * Crear nuevo tenant
   */
  async createTenant(data: CreateTenant): Promise<ApiResponse<Tenant>> {
    try {
      // Validar datos con Zod
      const validatedData = CreateTenantSchema.parse(data)

      // Verificar si el subdominio ya existe
      const { data: existingTenant } = await this.supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', validatedData.subdomain)
        .single()

      if (existingTenant) {
        return {
          success: false,
          message: 'This subdomain is already taken',
          error: 'SUBDOMAIN_TAKEN'
        }
      }

      // Crear tenant
      const { data: newTenant, error } = await this.supabase
        .from('tenants')
        .insert(validatedData)
        .select()
        .single()

      if (error) {
        console.error('Tenant creation error:', error)
        return {
          success: false,
          message: 'Failed to create tenant',
          error: 'TENANT_CREATION_FAILED',
          data: { originalError: error.message }
        }
      }

      if (!newTenant) {
        return {
          success: false,
          message: 'Failed to create tenant',
          error: 'TENANT_CREATION_FAILED'
        }
      }

      return {
        success: true,
        message: 'Tenant created successfully',
        data: newTenant
      }

    } catch (error) {
      console.error('TenantService error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Tenant creation error',
        error: 'TENANT_VALIDATION_ERROR',
        data: error instanceof Error ? { validationError: error.message } : null
      }
    }
  }

  /**
   * Verificar disponibilidad de subdominio
   */
  async checkSubdomainAvailability(subdomain: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', subdomain.toLowerCase())
        .single()

      console.log('TenantService checkSubdomainAvailability data:', data, 'error:', error)

      // Si hay datos, el subdominio está ocupado
      if (data) {
        return false
      }
      
      // Si no hay datos y el error es "not found", el subdominio está disponible
      if (error && error.code === 'PGRST116') {
        return true
      }
      
      // Para cualquier otro error, asumimos que no está disponible (modo seguro)
      if (error) {
        console.error('Unexpected error checking subdomain:', error)
        return false
      }
      
      // Si no hay datos ni error (raro), asumimos disponible
      return true
    } catch (error) {
      console.error('Error checking subdomain availability:', error)
      return false
    }
  }

  /**
   * Obtener tenant por subdominio
   */
  async getTenantBySubdomain(subdomain: string): Promise<ApiResponse<Tenant>> {
    try {
      const { data: tenant, error } = await this.supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain)
        .eq('active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            message: 'Tenant not found',
            error: 'TENANT_NOT_FOUND'
          }
        }

        return {
          success: false,
          message: 'Failed to fetch tenant',
          error: 'TENANT_FETCH_ERROR',
          data: { originalError: error.message }
        }
      }

      return {
        success: true,
        message: 'Tenant found',
        data: tenant
      }

    } catch (error) {
      console.error('Get tenant error:', error)
      return {
        success: false,
        message: 'Failed to fetch tenant',
        error: 'TENANT_FETCH_ERROR',
        data: error instanceof Error ? { error: error.message } : null
      }
    }
  }

  /**
   * Desactivar tenant
   */
  async deactivateTenant(tenantId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('tenants')
        .update({ active: false })
        .eq('id', tenantId)

      if (error) {
        return {
          success: false,
          message: 'Failed to deactivate tenant',
          error: 'TENANT_DEACTIVATION_FAILED',
          data: { originalError: error.message }
        }
      }

      return {
        success: true,
        message: 'Tenant deactivated successfully'
      }

    } catch (error) {
      console.error('Deactivate tenant error:', error)
      return {
        success: false,
        message: 'Failed to deactivate tenant',
        error: 'TENANT_DEACTIVATION_ERROR'
      }
    }
  }
}