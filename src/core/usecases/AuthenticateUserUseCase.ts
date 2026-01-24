import { IUserRepository } from '@/core/services/IUserRepository';
import { ITenantRepository } from '@/core/services/ITenantRepository';
import { User } from '@/core/entities/User';
import { Tenant } from '@/core/entities/Tenant';
import { BaseService } from '@/infrastructure/database/client/BaseService';
import { InvalidCredentialsError, TenantNotFoundError } from '@/shared/errors/ApplicationError';

interface AuthenticateUserDTO {
  email: string;
  password: string;
  subdomain: string;
}

interface AuthenticateUserResult {
  success: boolean;
  user?: User;
  tenant?: Tenant;
  token?: string;
  error?: string;
}

export class AuthenticateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private tenantRepository: ITenantRepository
  ) {}

  async execute(data: AuthenticateUserDTO): Promise<AuthenticateUserResult> {
    try {
      // 1. Validar que el tenant exista y esté activo
      const tenant = await this.tenantRepository.findBySubdomain(data.subdomain);
      if (!tenant || !tenant.isActive) {
        return {
          success: false,
          error: 'Tenant no encontrado o inactivo'
        };
      }

      // 2. Autenticar con Supabase usando service keys
      const baseService = new BaseService();
      const { data: authData, error } = await baseService.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password
      });

      if (error || !authData.session) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // 3. Buscar usuario por email y tenant
      const user = await this.userRepository.findByEmailAndTenant(data.email, tenant.id);
      if (!user) {
        return {
          success: false,
          error: 'Usuario no encontrado en este tenant'
        };
      }

      // 4. Retornar éxito con datos del usuario
      return {
        success: true,
        user,
        tenant,
        token: authData.session.access_token
      };

    } catch (error) {
      console.error('[AuthenticateUserUseCase Error]', error);
      return {
        success: false,
        error: 'Error en la autenticación'
      };
    }
  }
}