import { User } from '../entities/User'
import { IUserRepository } from '../services/IUserRepository'

export class UserService {
  constructor(private userRepository: IUserRepository) {}

async createUser(
    email: string,
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador',
    tenantId?: string // Optional for backward compatibility
  ): Promise<User> {
    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(email)
    if (existingUser) {
      throw new Error('Email already exists')
    }

    // Note: User.create() still needs tenantId for admin operations
    // For tenant-specific users, tenantId comes from repository context
    if (!tenantId) {
      throw new Error('Tenant ID is required for user creation')
    }

    const userData = User.create(email, tenantId, role)
    return await this.userRepository.create(userData)
  }

  async getUserById(id: string): Promise<User | null> {
    return await this.userRepository.findById(id)
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email)
  }

async getUsersByTenant(): Promise<User[]> {
    return await this.userRepository.findByTenantId()
  }

  async updateUserRole(
    id: string,
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  ): Promise<User> {
    return await this.userRepository.updateRole(id, role)
  }

  async updateUser(id: string, data: { email?: string }): Promise<User> {
    // If updating email, check if it already exists
    if (data.email) {
      const existingUser = await this.userRepository.findByEmail(data.email)
      if (existingUser && existingUser.id !== id) {
        throw new Error('Email already exists')
      }
    }

    return await this.userRepository.update(id, data)
  }

  async deleteUser(id: string): Promise<void> {
    // Add business logic for user deletion
    await this.userRepository.delete(id)
  }

  async authenticateUser(email: string): Promise<User | null> {
    // This would typically integrate with authentication provider
    // For now, just return the user if found
    return await this.userRepository.findByEmail(email)
  }
}