import { ApiResponse } from '@/shared/types/schemas'
import { Register, Tenant, User, RegisterSchema } from '@/shared/types/schemas'
import { TenantService } from './TenantService'
import { UserService } from './UserService'

// Type for successful registration response
interface RegistrationSuccessResponse {
  tenant: Tenant
  user: User
}

// Type for error validation response
interface ErrorValidationResponse {
  success: false
  message: string
  error: string
  data: {
    validationError: string
    errors: string[]
  }
}

/**
 * Servicio de orquestación de registro
 * Responsabilidad: Coordinar la creación de tenant + usuario de forma atómica
 */
export class RegistrationService {
  private tenantService = new TenantService()
  private userService = new UserService()

  /**
   * Registrar nuevo negocio con usuario administrador
   * Flujo atómico: o todo funciona o se hace rollback completo
   */
  async registerNewBusiness(data: Register): Promise<ApiResponse<RegistrationSuccessResponse>> {
    console.log('🚀 Starting business registration:', data)

    try {
      // Validar datos con Zod
      const validatedData = RegisterSchema.parse(data)
      console.log('✅ Data validated:', validatedData)

      // Paso 1: Crear tenant
      console.log('📝 Step 1: Creating tenant...')
      const tenantResult = await this.tenantService.createTenant({
        name: validatedData.name,
        subdomain: validatedData.tenant_subdomain,
        active: true
      })

      if (!tenantResult.success || !tenantResult.data) {
        console.error('❌ Tenant creation failed:', tenantResult)
        return {
          success: false,
          message: tenantResult.message,
          error: tenantResult.error || 'TENANT_CREATION_FAILED',
          data: { originalError: tenantResult.data }
        } as any
      }

      const newTenant = tenantResult.data
      console.log('✅ Tenant created:', newTenant)

      // Paso 2: Crear usuario administrador
      console.log('👤 Step 2: Creating admin user...')
      const userResult = await this.userService.createAdminUser({
        email: validatedData.email,
        password: validatedData.password,
        tenant_id: newTenant.id,
        role: 'admin'
      }, newTenant.id)

      if (!userResult.success || !userResult.data) {
        console.error('❌ User creation failed, rolling back tenant:', userResult)
        
        // Rollback: Eliminar tenant creado
        await this.tenantService.deactivateTenant(newTenant.id)
        
        return {
          success: false,
          message: userResult.message,
          error: userResult.error || 'USER_CREATION_FAILED',
          data: { 
            originalError: userResult.data,
            rollbackAction: 'tenant_deactivated'
          }
        } as any
      }

      const newUser = userResult.data
      console.log('✅ Admin user created:', newUser)

      // Éxito completo: todo creado correctamente
      console.log('🎉 Business registration completed successfully!')
      
      return {
        success: true,
        message: 'Business registration successful! Your admin account has been created.',
        data: {
          tenant: newTenant,
          user: newUser
        }
      }

    } catch (error) {
      console.error('💥 RegistrationService critical error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration validation error',
        error: 'REGISTRATION_VALIDATION_ERROR',
        data: error instanceof Error ? { validationError: error.message } : null
      }
    }
  }

  /**
   * Verificar disponibilidad completa para registro
   */
  async checkRegistrationAvailability(subdomain: string, email: string): Promise<{
    subdomainAvailable: boolean
    emailAvailable: boolean
    canProceed: boolean
  }> {
    try {
      // Verificar subdominio
      const subdomainAvailable = await this.tenantService.checkSubdomainAvailability(subdomain)
      
      // Verificar email (en auth.users)
      const serviceClient = (this.userService as any).serviceClient
      const { data: existingAuthUser } = await serviceClient.auth.admin.listUsers({
        filters: {
          email: email
        },
        page: 1,
        perPage: 1
      })

      const emailAvailable = !existingAuthUser?.users || existingAuthUser.users.length === 0

      return {
        subdomainAvailable,
        emailAvailable,
        canProceed: subdomainAvailable && emailAvailable
      }

    } catch (error) {
      console.error('Availability check error:', error)
      return {
        subdomainAvailable: false,
        emailAvailable: false,
        canProceed: false
      }
    }
  }

  /**
   * Validar datos de registro sin ejecutar creación
   */
  async validateRegistrationData(data: Register): Promise<ApiResponse<{
    isValid: boolean
    errors: string[]
  }>> {
    try {
      const errors: string[] = []

      // Validación Zod básica
      const validatedData = RegisterSchema.parse(data)

      // Verificar disponibilidad de subdominio
      const subdomainAvailable = await this.tenantService.checkSubdomainAvailability(validatedData.tenant_subdomain)
      if (!subdomainAvailable) {
        errors.push('Subdomain is already taken')
      }

      // Verificar disponibilidad de email
      const serviceClient = (this.userService as any).serviceClient
      const { data: existingAuthUser } = await serviceClient.auth.admin.listUsers({
        filters: {
          email: validatedData.email
        },
        page: 1,
        perPage: 1
      })

      if (existingAuthUser?.users && existingAuthUser.users.length > 0) {
        errors.push('Email is already registered')
      }

      // Validaciones de negocio adicionales
      if (validatedData.tenant_subdomain.length < 3) {
        errors.push('Subdomain must be at least 3 characters')
      }

      if (validatedData.name.length < 3) {
        errors.push('Business name must be at least 3 characters')
      }

      // Verificar subdominios reservados
      const reservedSubdomains = ['api', 'admin', 'www', 'mail', 'ftp', 'cdn', 'staging', 'dev', 'test', 'app', 'blog', 'shop', 'store', 'support', 'help', 'docs']
      if (reservedSubdomains.includes(validatedData.tenant_subdomain.toLowerCase())) {
        errors.push('Subdomain is reserved')
      }

      return {
        success: true,
        message: errors.length === 0 ? 'Validation passed' : 'Validation failed',
        data: {
          isValid: errors.length === 0,
          errors
        }
      }

    } catch (error) {
      console.error('Validation error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Validation error',
        error: 'VALIDATION_ERROR',
        data: {
          validationError: error instanceof Error ? error.message : 'Unknown validation error',
          errors: ['Validation system error']
        }
      }
    }
  }

  /**
   * Obtener resumen del registro para confirmación
   */
  async getRegistrationSummary(subdomain: string): Promise<ApiResponse<RegistrationSummary>> {
    try {
      // Obtener tenant
      const tenantResult = await this.tenantService.getTenantBySubdomain(subdomain)
      
      if (!tenantResult.success || !tenantResult.data) {
        return {
          success: false,
          message: 'Tenant not found',
          error: 'TENANT_NOT_FOUND'
        }
      }

      // Contar usuarios del tenant
      const serviceClient = (this.userService as any).browserClient
      const { data: users } = await serviceClient
        .from('users')
        .select('id')
        .eq('tenant_id', tenantResult.data.id)

      return {
        success: true,
        message: 'Registration summary found',
        data: {
          tenant: tenantResult.data,
          userCount: users?.length || 0,
          canAccess: (users?.length || 0) > 0
        }
      }

    } catch (error) {
      console.error('Get summary error:', error)
      return {
        success: false,
        message: 'Failed to get registration summary',
        error: 'SUMMARY_ERROR'
      }
    }
  }
}