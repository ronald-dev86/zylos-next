import { createServiceClient, createClient } from '@/lib/supabase/client'
import { ApiResponse } from '@/shared/types/schemas'
import { CreateUser, User } from '@/shared/types/schemas'
import { CreateUserSchema } from '@/shared/types/schemas'

/**
 * Servicio de gestión de usuarios
 * Responsabilidad: Creación y gestión de usuarios en Supabase Auth + tabla users
 */
export class UserService {
  private serviceClient = createServiceClient()
  private browserClient = createClient()

  /**
   * Crear usuario administrador para un tenant
   */
  async createAdminUser(userData: CreateUser, tenantId: string): Promise<ApiResponse<User>> {
    try {
      // Validar datos con Zod
      const validatedData = CreateUserSchema.parse(userData)

      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await this.serviceClient.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: true, // Auto-confirmar para admin creation
        user_metadata: {
          tenant_id: tenantId,
          role: 'admin'
        }
      })

      if (authError) {
        console.error('Auth user creation error:', authError)
        return {
          success: false,
          message: authError.message,
          error: 'AUTH_USER_CREATION_FAILED',
          data: { originalError: authError.message }
        }
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'Failed to create user in authentication system',
          error: 'AUTH_USER_CREATION_FAILED'
        }
      }

      // 2. Crear registro en tabla users explícitamente (sin trigger)
      const { data: userRecord, error: userError } = await this.serviceClient
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          tenant_id: tenantId,
          role: 'admin'
        })
        .select()
        .single()

      if (userError) {
        // Rollback auth user si falla la inserción en users
        console.error('User table creation error, rolling back auth user:', userError)
        await this.serviceClient.auth.admin.deleteUser(authData.user.id)
        
        return {
          success: false,
          message: 'Failed to create user record',
          error: 'USER_RECORD_CREATION_FAILED',
          data: { originalError: userError.message }
        }
      }

      if (!userRecord) {
        return {
          success: false,
          message: 'Failed to create user record',
          error: 'USER_RECORD_CREATION_FAILED'
        }
      }

      console.log('User created successfully:', { auth: authData.user, record: userRecord })

      return {
        success: true,
        message: 'Admin user created successfully',
        data: userRecord
      }

    } catch (error) {
      console.error('UserService error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'User creation error',
        error: 'USER_VALIDATION_ERROR',
        data: error instanceof Error ? { validationError: error.message } : null
      }
    }
  }

  /**
   * Crear usuario regular (no admin)
   */
  async createUser(userData: CreateUser, tenantId: string, role: 'vendedor' | 'contador' = 'vendedor'): Promise<ApiResponse<User>> {
    try {
      // Validar datos con Zod
      const validatedData = CreateUserSchema.parse(userData)

      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await this.serviceClient.auth.admin.createUser({
        email: validatedData.email,
        password: validatedData.password,
        email_confirm: false, // Requerir confirmación por email
        user_metadata: {
          tenant_id: tenantId,
          role: role
        }
      })

      if (authError) {
        console.error('Auth user creation error:', authError)
        return {
          success: false,
          message: authError.message,
          error: 'AUTH_USER_CREATION_FAILED',
          data: { originalError: authError.message }
        }
      }

      if (!authData.user) {
        return {
          success: false,
          message: 'Failed to create user in authentication system',
          error: 'AUTH_USER_CREATION_FAILED'
        }
      }

      // 2. Crear registro en tabla users
      const { data: userRecord, error: userError } = await this.serviceClient
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          tenant_id: tenantId,
          role: role
        })
        .select()
        .single()

      if (userError) {
        // Rollback auth user si falla
        console.error('User table creation error, rolling back auth user:', userError)
        await this.serviceClient.auth.admin.deleteUser(authData.user.id)
        
        return {
          success: false,
          message: 'Failed to create user record',
          error: 'USER_RECORD_CREATION_FAILED',
          data: { originalError: userError.message }
        }
      }

      return {
        success: true,
        message: 'User created successfully',
        data: userRecord
      }

    } catch (error) {
      console.error('UserService error:', error)
      return {
        success: false,
        message: error instanceof Error ? error.message : 'User creation error',
        error: 'USER_VALIDATION_ERROR',
        data: error instanceof Error ? { validationError: error.message } : null
      }
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const { data: user, error } = await this.browserClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            message: 'User not found',
            error: 'USER_NOT_FOUND'
          }
        }

        return {
          success: false,
          message: 'Failed to fetch user',
          error: 'USER_FETCH_ERROR',
          data: { originalError: error.message }
        }
      }

      return {
        success: true,
        message: 'User found',
        data: user
      }

    } catch (error) {
      console.error('Get user error:', error)
      return {
        success: false,
        message: 'Failed to fetch user',
        error: 'USER_FETCH_ERROR',
        data: error instanceof Error ? { error: error.message } : null
      }
    }
  }

  /**
   * Actualizar rol de usuario
   */
  async updateUserRole(userId: string, role: 'super_admin' | 'admin' | 'vendedor' | 'contador'): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.browserClient
        .from('users')
        .update({ role })
        .eq('id', userId)

      if (error) {
        return {
          success: false,
          message: 'Failed to update user role',
          error: 'USER_ROLE_UPDATE_FAILED',
          data: { originalError: error.message }
        }
      }

      return {
        success: true,
        message: 'User role updated successfully'
      }

    } catch (error) {
      console.error('Update user role error:', error)
      return {
        success: false,
        message: 'Failed to update user role',
        error: 'USER_ROLE_UPDATE_ERROR'
      }
    }
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(userId: string): Promise<ApiResponse<void>> {
    try {
      // 1. Eliminar de tabla users
      const { error: userError } = await this.serviceClient
        .from('users')
        .delete()
        .eq('id', userId)

      if (userError) {
        return {
          success: false,
          message: 'Failed to delete user record',
          error: 'USER_DELETE_FAILED',
          data: { originalError: userError.message }
        }
      }

      // 2. Eliminar de Supabase Auth
      const { error: authError } = await this.serviceClient.auth.admin.deleteUser(userId)

      if (authError) {
        console.error('Failed to delete auth user, but user record was deleted:', authError)
        return {
          success: false,
          message: 'Failed to delete authentication user',
          error: 'AUTH_USER_DELETE_FAILED',
          data: { originalError: authError.message }
        }
      }

      return {
        success: true,
        message: 'User deleted successfully'
      }

    } catch (error) {
      console.error('Delete user error:', error)
      return {
        success: false,
        message: 'Failed to delete user',
        error: 'USER_DELETE_ERROR'
      }
    }
  }
}