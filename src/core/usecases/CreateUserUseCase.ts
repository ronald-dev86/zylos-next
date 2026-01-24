import { IUserRepository } from '@/core/services/IUserRepository';
import { User } from '@/core/entities/User';
import { BaseService } from '@/infrastructure/database/client/BaseService';

export interface CreateUserDTO {
  email: string;
  password: string;
  role: 'super_admin' | 'admin' | 'vendedor' | 'contador';
}

export interface CreateUserResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class CreateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: CreateUserDTO): Promise<CreateUserResult> {
    try {
      // 1. Validar que el email no exista ya en el tenant
      const existingUser = await this.userRepository.findByEmail(data.email);
      if (existingUser) {
        return {
          success: false,
          error: 'El email ya está registrado'
        };
      }

      // 2. Crear usuario en Supabase Auth primero
      const baseService = new BaseService();
      const { data: authData, error: authError } = await baseService.supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true
      });

      if (authError || !authData.user) {
        return {
          success: false,
          error: 'Error al crear usuario en auth: ' + (authError?.message || 'Unknown error')
        };
      }

      // 3. Crear usuario en nuestra tabla users
      const user = await this.userRepository.create({
        email: data.email,
        role: data.role
      });

      return {
        success: true,
        user
      };

    } catch (error) {
      console.error('[CreateUserUseCase Error]', error);
      return {
        success: false,
        error: 'Error al crear usuario'
      };
    }
  }
}