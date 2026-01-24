import { IUserRepository } from '@/core/services/IUserRepository';
import { User } from '@/core/entities/User';
import { PaginationParams, PaginatedResponse } from '@/shared/types/common';

export interface GetUsersDTO {
  pagination?: PaginationParams;
  role?: 'super_admin' | 'admin' | 'vendedor' | 'contador';
}

export interface GetUsersResult {
  success: boolean;
  users?: PaginatedResponse<User>;
  error?: string;
}

export class GetUsersUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(data: GetUsersDTO): Promise<GetUsersResult> {
    try {
      const pagination = data.pagination || {
        page: 1,
        limit: 20
      };

      // Por ahora implementamos búsqueda básica por tenant
      // Podríamos extender para filtrar por rol si el repository lo soporta
      const users = await this.userRepository.findByTenantId(pagination);

      return {
        success: true,
        users
      };

    } catch (error) {
      console.error('[GetUsersUseCase Error]', error);
      return {
        success: false,
        error: 'Error al obtener usuarios'
      };
    }
  }
}