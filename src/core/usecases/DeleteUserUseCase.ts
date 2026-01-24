import { IUserRepository } from '@/core/services/IUserRepository';
import { BaseService } from '@/infrastructure/database/client/BaseService';

export interface DeleteUserDTO {
  id: string;
}

export interface DeleteUserResult {
  success: boolean;
  error?: string;
}

export class DeleteUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: DeleteUserDTO): Promise<DeleteUserResult> {
    try {
      // 1. Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(data.id);
      if (!existingUser) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      // 2. Eliminar usuario de Supabase Auth
      const baseService = new BaseService();
      const { error: authError } = await baseService.supabase.auth.admin.deleteUser(
        data.id
      );

      if (authError) {
        console.warn('Could not delete user from auth:', authError.message);
        // Continuamos con la eliminación de nuestra tabla aunque falle auth
      }

      // 3. Eliminar usuario de nuestra tabla users
      await this.userRepository.delete(data.id);

      return {
        success: true
      };

    } catch (error) {
      console.error('[DeleteUserUseCase Error]', error);
      return {
        success: false,
        error: 'Error al eliminar usuario'
      };
    }
  }
}