import { User } from '@/core/entities/User'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface IUserRepository {
  create(user: {
    email: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  }): Promise<User>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByTenantId(): Promise<User[]>
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<User>
  delete(id: string): Promise<void>
  updateRole(id: string, role: 'super_admin' | 'admin' | 'vendedor' | 'contador'): Promise<User>
}