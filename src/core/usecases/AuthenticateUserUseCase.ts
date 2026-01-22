import { IUserRepository } from '@/core/services/IUserRepository';
import { ITenantRepository } from '@/core/services/ITenantRepository';
import { User } from '@/core/entities/User';
import { Tenant } from '@/core/entities/Tenant';
import { supabaseAuth } from '@/shared/utils/supabase-auth';
import { 
  InvalidCredentialsError, 
  TenantNotFoundError, 
  AccountDisabledError 
} from '@/shared/errors/ApplicationError';

/**
 * DTO para autenticación de usuario
 */
export interface AuthenticateUserDTO {
  email: string;
  password: string;
  subdomain: string;
}

/**
 * Resultado de autenticación de usuario
 */
export interface AuthenticateUserResult {
  success: boolean;
  user?: User;
  tenant?: Tenant;
  token?: string;
  refreshToken?: string;
  error?: string;
}

/**
 * Caso de uso para autenticación de usuarios
 * Implementa lógica de negocio completa según Clean Architecture
 */
export class AuthenticateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tenantRepository: ITenantRepository
  ) {}

  /**
   * Ejecuta el caso de uso de autenticación
   */
  async execute(data: AuthenticateUserDTO): Promise<AuthenticateUserResult> {
    try {
      // 1. Validar que el tenant exista y esté activo
      const tenant = await this.tenantRepository.findBySubdomain(data.subdomain);
      
      if (!tenant) {
        return {
          success: false,
          error: `Tenant '${data.subdomain}' no encontrado`
        };
      }

      if (!tenant.isActive) {
        return {
          success: false,
          error: `Tenant '${data.subdomain}' está desactivado`
        };
      }

      // 2. Buscar usuario por email en el tenant
      const user = await this.userRepository.findByEmailAndTenant(data.email, tenant.id);
      
      if (!user) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'Cuenta desactivada'
        };
      }

      // 3. Autenticar con Supabase
      const authResult = await supabaseAuth.signInWithEmail(data.email, data.password);
      
      if (!authResult.session) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // 4. Actualizar último login del usuario
      await this.userRepository.updateLastLogin(user.id);

      // 5. Retornar éxito con todos los datos necesarios
      return {
        success: true,
        user,
        tenant,
        token: authResult.session.access_token,
        refreshToken: authResult.session.refresh_token
      };

    } catch (error) {
      console.error('[AuthenticateUserUseCase] Error:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Invalid login credentials')) {
          return {
            success: false,
            error: 'Credenciales inválidas'
          };
        }
      }
      
      return {
        success: false,
        error: 'Error en la autenticación'
      };
    }
  }

  /**
   * Refresca el token de un usuario
   */
  async refreshToken(refreshToken: string, tenantId: string): Promise<AuthenticateUserResult> {
    try {
      // Validar que el tenant exista
      const tenant = await this.tenantRepository.findById(tenantId);
      
      if (!tenant || !tenant.isActive) {
        return {
          success: false,
          error: 'Tenant inválido o inactivo'
        };
      }

      // Refrescar token con Supabase
      const authResult = await supabaseAuth.refreshToken(refreshToken);
      
      if (!authResult.session) {
        return {
          success: false,
          error: 'Error al refrescar token'
        };
      }

      // Obtener usuario actualizado
      const user = await this.userRepository.findById(authResult.user.id);
      
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'Usuario no encontrado o inactivo'
        };
      }

      return {
        success: true,
        user,
        tenant,
        token: authResult.session.access_token,
        refreshToken: authResult.session.refresh_token
      };

    } catch (error) {
      console.error('[AuthenticateUserUseCase] Refresh error:', error);
      return {
        success: false,
        error: 'Error al refrescar sesión'
      };
    }
  }

  /**
   * Cierra la sesión de un usuario
   */
  async signOut(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      await supabaseAuth.signOut();
      return { success: true };
    } catch (error) {
      console.error('[AuthenticateUserUseCase] SignOut error:', error);
      return {
        success: false,
        error: 'Error al cerrar sesión'
      };
    }
  }

  /**
   * Verifica si un token es válido
   */
  async verifyToken(token: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const authUser = await supabaseAuth.verifyToken(token);
      
      if (!authUser) {
        return {
          success: false,
          error: 'Token inválido'
        };
      }

      // Obtener datos completos del usuario
      const user = await this.userRepository.findByEmail(authUser.email || '');
      
      if (!user || !user.isActive) {
        return {
          success: false,
          error: 'Usuario no encontrado o inactivo'
        };
      }

      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('[AuthenticateUserUseCase] Verify error:', error);
      return {
        success: false,
        error: 'Error al verificar token'
      };
    }
  }
}