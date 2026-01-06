import { User } from '../entities/User'

export interface IUserRepository {
  create(user: {
    email: string
    tenantId: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  }): Promise<User>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  findByTenantId(tenantId: string): Promise<User[]>
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User>
  delete(id: string): Promise<void>
  updateRole(id: string, role: 'super_admin' | 'admin' | 'vendedor' | 'contador'): Promise<User>
}