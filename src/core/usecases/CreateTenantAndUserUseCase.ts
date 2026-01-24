import { ITenantRepository } from '@/core/services/ITenantRepository';
import { IUserRepository } from '@/core/services/IUserRepository';
import { Tenant } from '@/core/entities/Tenant';
import { User } from '@/core/entities/User';
import { ApplicationError } from '@/shared/errors/ApplicationError';

interface CreateTenantAndUserDTO {
  storeName: string;
  subdomain: string;
  ownerName: string;
  email: string;
  password: string;
}

interface CreateTenantAndUserResult {
  success: boolean;
  tenant?: Tenant;
  user?: User;
  token?: string;
  error?: string;
}

export class CreateTenantAndUserUseCase {
  constructor(
    private tenantRepository: ITenantRepository,
    private userRepository: IUserRepository
  ) {}

  async execute(data: CreateTenantAndUserDTO): Promise<CreateTenantAndUserResult> {
    try {
      // 1. Verificar que el subdominio esté disponible
      const existingTenant = await this.tenantRepository.findBySubdomain(data.subdomain);
      if (existingTenant) {
        return {
          success: false,
          error: 'Subdominio ya está en uso'
        };
      }

      // 2. Crear tenant
      const tenantData = {
        name: data.storeName,
        subdomain: data.subdomain.toLowerCase(),
        active: true
      };

      const newTenant = await this.tenantRepository.create(tenantData);
      if (!newTenant) {
        return {
          success: false,
          error: 'Error al crear tenant'
        };
      }

      // 3. Crear usuario a través del repositorio (este manejará la autenticación de Supabase)
      const userData = {
        email: data.email,
        password: data.password,
        name: data.ownerName,
        role: 'admin',
        tenantId: newTenant.id
      };

      const newUser = await this.userRepository.createWithAuth(userData);
      if (!newUser) {
        // Rollback tenant creation
        await this.tenantRepository.delete(newTenant.id);
        return {
          success: false,
          error: 'Error al crear usuario'
        };
      }

      // 4. Autenticar al nuevo usuario para obtener token
      const authResult = await this.userRepository.authenticate(data.email, data.password);
      if (!authResult.success || !authResult.user || !authResult.token) {
        return {
          success: false,
          error: 'Error en autenticación inicial'
        };
      }

      return {
        success: true,
        tenant: newTenant,
        user: authResult.user,
        token: authResult.token
      };

    } catch (error) {
      console.error('[CreateTenantAndUserUseCase Error]', error);
      
      if (error instanceof ApplicationError) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: 'Error interno del servidor'
      };
    }
  }
}