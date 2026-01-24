import { User } from '@/core/entities/User'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface IUserRepository {
  create(user: {
    email: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  }): Promise<User>
  createWithAuth(user: {
    email: string
    password: string
    name?: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
    tenantId: string
  }): Promise<User | null>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByEmailAndTenant(email: string, tenantId: string): Promise<User | null>
  findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<User>>
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<User>
  delete(id: string): Promise<void>
  updateRole(id: string, role: 'super_admin' | 'admin' | 'vendedor' | 'contador'): Promise<User>
  authenticate(email: string, password: string): Promise<{
    success: boolean
    user?: User
    token?: string
    error?: string
  }>
}