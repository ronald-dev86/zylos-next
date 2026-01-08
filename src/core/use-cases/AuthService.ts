import { createClient } from '@/lib/supabase/client'
import { 
  Login, 
  Register, 
  ForgotPassword, 
  ResetPassword,
  LoginSchema,
  RegisterSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  ApiResponse 
} from '@/shared/types/schemas'
import { AuthUser } from '@/shared/types/common'

/**
 * Servicio de Autenticación con validación completa y manejo de errores
 */
export class AuthService {
  private supabase = createClient()
  private maxLoginAttempts = 5
  private lockoutDuration = 15 * 60 * 1000 // 15 minutos en ms

  /**
   * Iniciar sesión con validación completa y protección contra intentos
   */
  async login(credentials: Login): Promise<ApiResponse<any>> {
    try {
      // Validar credenciales con Zod
      const validatedCredentials = LoginSchema.parse(credentials)

      // Verificar si el usuario está bloqueado por intentos fallidos
      const lockoutCheck = await this.checkLoginLockout(validatedCredentials.email)
      if (lockoutCheck.isLocked) {
        return {
          success: false,
          message: `Too many failed attempts. Account locked for ${Math.ceil(lockoutCheck.remainingTime / 60000)} minutes.`,
          error: 'ACCOUNT_LOCKED',
          data: {
            remainingTime: lockoutCheck.remainingTime,
            attempts: lockoutCheck.attempts
          }
        }
      }

      // Obtener información del tenant basado en el dominio actual
      const tenantInfo = await this.getTenantFromDomain()
      if (!tenantInfo.success) {
        return {
          success: false,
          message: 'Invalid tenant or domain not found',
          error: 'TENANT_NOT_FOUND'
        }
      }

      // Autenticar con Supabase
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email: validatedCredentials.email,
        password: validatedCredentials.password
      })

      if (authError) {
        // Registrar intento fallido
        await this.recordFailedLogin(validatedCredentials.email)
        
        // Determinar tipo de error para mensaje amigable
        let errorMessage = 'Login failed'
        let errorType = 'LOGIN_FAILED'
        
        if (authError.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password'
          errorType = 'INVALID_CREDENTIALS'
        } else if (authError.message.includes('Email not confirmed')) {
          errorMessage = 'Please confirm your email before logging in'
          errorType = 'EMAIL_NOT_CONFIRMED'
        }

        return {
          success: false,
          message: errorMessage,
          error: errorType,
          data: { originalError: authError.message }
        }
      }

      if (!authData.user || !authData.session) {
        return {
          success: false,
          message: 'Authentication failed',
          error: 'AUTH_FAILED'
        }
      }

      // Verificar que el usuario pertenezca al tenant actual
      const userVerification = await this.verifyUserTenant(authData.user.id, tenantInfo.data!.id)
      if (!userVerification.success) {
        await this.supabase.auth.signOut()
        return {
          success: false,
          message: 'You do not have access to this tenant',
          error: 'TENANT_ACCESS_DENIED'
        }
      }

      // Limpiar intentos fallidos exitosos
      await this.clearFailedLogins(validatedCredentials.email)

      // Determinar URL de redirección basada en rol
      const redirectUrl = this.getRedirectUrl(userVerification.data!.role)

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userVerification.data!,
          session: authData.session,
          redirect_url: redirectUrl
        }
      }

    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login validation error',
        error: 'LOGIN_VALIDATION_ERROR',
        data: error instanceof Error ? { validationError: error.message } : null
      }
    }
  }

  /**
   * Registrar nuevo usuario y tenant
   */
  async register(userData: Register): Promise<ApiResponse<any>> {
    try {
      // Validar datos de registro
      const validatedData = RegisterSchema.parse(userData)

      // Verificar si el tenant ya existe
      const { data: existingTenant } = await this.supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', validatedData.tenant_subdomain)
        .single()

      if (existingTenant) {
        return {
          success: false,
          message: 'This subdomain is already taken',
          error: 'SUBDOMAIN_TAKEN'
        }
      }

      // Crear nuevo tenant
      const { data: newTenant, error: tenantError } = await this.supabase
        .from('tenants')
        .insert({
          name: validatedData.tenant_subdomain, // Temporal, puede actualizarse después
          subdomain: validatedData.tenant_subdomain
        } as any)
        .select()
        .single()

      if (tenantError || !newTenant) {
        return {
          success: false,
          message: 'Failed to create tenant',
          error: 'TENANT_CREATION_FAILED'
        }
      }

      // Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          data: {
            tenant_id: (newTenant as any)?.id,
            role: 'admin' // Primer usuario es admin del tenant
          }
        }
      })

      console.log('Auth signup result:', { authData, authError })
      console.log('Tenant ID for user:', (newTenant as any)?.id)

      if (authError) {
        // Rollback tenant creation si auth falla
        await this.supabase.from('tenants').delete().eq('id', (newTenant as any)?.id)
        
        return {
          success: false,
          message: authError.message,
          error: 'USER_CREATION_FAILED'
        }
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'Failed to create user',
          error: 'USER_CREATION_FAILED'
        }
      }

      // Verificar que el usuario se creó correctamente en la tabla users
      if (authData.user) {
        // First check if there are multiple records
        const { data: allUserRecords, error: allError } = await this.supabase
          .from('users')
          .select('id, email, tenant_id, role, created_at')
          .eq('id', authData.user.id)

        console.log('All user records after creation:', { allUserRecords, allError })

        if (allError) {
          console.error('Error fetching user records:', allError)
          return {
            success: false,
            message: 'Failed to verify user creation',
            error: 'USER_VERIFICATION_ERROR',
            data: { originalError: allError.message }
          }
        }

        if (!allUserRecords || allUserRecords.length === 0) {
          console.error('User record not found in users table')
          return {
            success: false,
            message: 'User created but record verification failed',
            error: 'USER_VERIFICATION_FAILED'
          }
        }

        if (allUserRecords.length > 1) {
          console.error('Multiple user records found:', allUserRecords)
          return {
            success: false,
            message: 'Multiple user records detected',
            error: 'DUPLICATE_USER_RECORDS',
            data: { recordCount: allUserRecords.length }
          }
        }

        const userRecord = allUserRecords[0]
        console.log('Single user record verified:', userRecord)

        return {
          success: true,
          message: 'Registration successful. Please check your email to confirm your account.',
          data: {
            user: {
              id: authData.user.id,
              email: authData.user.email!,
              tenant_id: (userRecord as any)?.tenant_id,
              role: (userRecord as any)?.role
            },
            tenant: newTenant,
            session: authData.session
          }
        }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration validation error',
        error: 'REGISTRATION_VALIDATION_ERROR',
        data: error instanceof Error ? { validationError: error.message } : null
      }
    }

    // Return error case por defecto
    return {
      success: false,
      message: 'Registration failed unexpectedly',
      error: 'UNKNOWN_ERROR'
    }
  }

  /**
   * Cerrar sesión
   */
  async logout(): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase.auth.signOut()
      
      if (error) {
        return {
          success: false,
          message: 'Failed to logout',
          error: 'LOGOUT_FAILED'
        }
      }

      return {
        success: true,
        message: 'Logged out successfully'
      }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        success: false,
        message: 'Logout error',
        error: 'LOGOUT_ERROR'
      }
    }
  }

  /**
   * Solicitar recuperación de contraseña
   */
  async forgotPassword(emailData: ForgotPassword): Promise<ApiResponse<void>> {
    try {
      const validatedData = ForgotPasswordSchema.parse(emailData)

      const { error } = await this.supabase.auth.resetPasswordForEmail(
        validatedData.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`
        }
      )

      if (error) {
        return {
          success: false,
          message: error.message,
          error: 'PASSWORD_RESET_FAILED'
        }
      }

      return {
        success: true,
        message: 'Password reset link sent to your email'
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password reset error',
        error: 'PASSWORD_RESET_ERROR'
      }
    }
  }

  /**
   * Restablecer contraseña
   */
  async resetPassword(resetData: ResetPassword): Promise<ApiResponse<void>> {
    try {
      const validatedData = ResetPasswordSchema.parse(resetData)

      const { error } = await this.supabase.auth.updateUser({
        password: validatedData.password
      })

      if (error) {
        return {
          success: false,
          message: error.message,
          error: 'PASSWORD_UPDATE_FAILED'
        }
      }

      return {
        success: true,
        message: 'Password updated successfully'
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Password update error',
        error: 'PASSWORD_UPDATE_ERROR'
      }
    }
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Obtener información del tenant desde el dominio actual
   */
  private async getTenantFromDomain(): Promise<ApiResponse<{ id: string; subdomain: string }>> {
    try {
      const hostname = window.location.hostname
      const subdomain = hostname.split('.')[0]
      
      // Si es el dominio principal, retornar error
      if (hostname === 'localhost' || hostname === 'zylos.com') {
        return {
          success: false,
          message: 'Tenant subdomain is required',
          error: 'TENANT_REQUIRED'
        }
      }

      const { data, error } = await this.supabase
        .from('tenants')
        .select('id, subdomain')
        .eq('subdomain', subdomain as string)
        .eq('active', true)
        .single()

      if (error || !data) {
        return {
          success: false,
          message: 'Tenant not found or inactive',
          error: 'TENANT_NOT_FOUND'
        }
      }

      return {
        success: true,
        message: 'Tenant found',
        data: { id: (data as any)?.id, subdomain: (data as any)?.subdomain }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to determine tenant',
        error: 'TENANT_DETECTION_ERROR'
      }
    }
  }

  /**
   * Verificar que el usuario pertenezca al tenant
   */
  private async verifyUserTenant(userId: string, tenantId: string): Promise<ApiResponse<AuthUser>> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, email, tenant_id, role')
        .eq('id', userId)
        .eq('tenant_id', tenantId)
        .single()

      if (error || !data) {
        return {
          success: false,
          message: 'User not found in this tenant',
          error: 'USER_TENANT_MISMATCH'
        }
      }

      return {
        success: true,
        message: 'User verified',
        data: data as AuthUser
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to verify user tenant',
        error: 'USER_VERIFICATION_ERROR'
      }
    }
  }

  /**
   * Determinar URL de redirección basada en rol
   */
  private getRedirectUrl(role: string): string {
    const roleRedirects: Record<string, string> = {
      'super_admin': '/admin/dashboard',
      'admin': '/dashboard',
      'vendedor': '/pos',
      'contador': '/accounting'
    }
    
    return roleRedirects[role] || '/dashboard'
  }

  /**
   * Verificar si el usuario está bloqueado por intentos fallidos
   */
  private async checkLoginLockout(email: string): Promise<{
    isLocked: boolean
    attempts: number
    remainingTime: number
  }> {
    // En implementación real, esto verificaría en Redis/base de datos
    // Por ahora, retornamos que no está bloqueado
    return {
      isLocked: false,
      attempts: 0,
      remainingTime: 0
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

      console.log('checkSubdomainAvailability data:', data, 'error:', error)

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
   * Registrar intento fallido de login
   */
  private async recordFailedLogin(email: string): Promise<void> {
    // En implementación real, esto guardaría en Redis/base de datos
    // Por ahora, solo log
    console.log(`Failed login attempt for email: ${email}`)
  }

  /**
   * Limpiar intentos fallidos después de login exitoso
   */
  private async clearFailedLogins(email: string): Promise<void> {
    // En implementación real, esto limpiaría en Redis/base de datos
    console.log(`Cleared failed login attempts for email: ${email}`)
  }
}