import { IUserRepository } from '@/core/services/IUserRepository';
import { User } from '@/core/entities/User';

export interface UpdateUserDTO {
  id: string;
  email?: string;
  role?: 'super_admin' | 'admin' | 'vendedor' | 'contador';
}

export interface UpdateUserResult {
  success: boolean;
  user?: User;
  error?: string;
}

export class UpdateUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: UpdateUserDTO): Promise<UpdateUserResult> {
    try {
      // 1. Verificar que el usuario existe
      const existingUser = await this.userRepository.findById(data.id);
      if (!existingUser) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      // 2. Si se actualiza email, verificar que no exista ya
      if (data.email && data.email !== existingUser.email) {
        const emailExists = await this.userRepository.findByEmail(data.email);
        if (emailExists) {
          return {
            success: false,
            error: 'El email ya está en uso por otro usuario'
          };
        }
      }

      // 3. Actualizar usuario
      const updatedUser = await this.userRepository.update(data.id, {
        email: data.email,
        role: data.role
      });

      return {
        success: true,
        user: updatedUser
      };

    } catch (error) {
      console.error('[UpdateUserUseCase Error]', error);
      return {
        success: false,
        error: 'Error al actualizar usuario'
      };
    }
  }
}