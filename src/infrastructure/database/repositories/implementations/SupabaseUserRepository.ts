import { IUserRepository } from '@/core/services/IUserRepository'
import { User } from '@/core/entities/User'
import { BaseRepository } from '../base/BaseRepository'
import { Database } from '@/shared/types/database'

export class SupabaseUserRepository extends BaseRepository<User> implements IUserRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  protected mapToEntity(data: any): User {
    return new User({
      id: data.id,
      email: data.email,
      tenantId: data.tenant_id,
      role: data.role,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    })
  }

  protected getTableName(): string {
    return 'users'
  }

  async create(user: {
    email: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
  }): Promise<User> {
    if (!this.tenantId) {
      throw new Error('Tenant ID is required to create user')
    }
    
    const { data, error } = await this.withTenantFilter()
      .from('users')
      .insert([{
        email: user.email,
        tenant_id: this.tenantId,
        role: user.role
      }])
      .select()
      .single()

    if (error) throw new Error(`Failed to create user: ${error.message}`)
    return this.mapToEntity(data)
  }

  async findById(id: string): Promise<User | null> {
    return await this.findByIdInternal(id)
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.withTenantFilter()
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1)

    if (error) throw new Error(`Failed to find user by email: ${error.message}`)
    if (!data || data.length === 0) return null

    return this.mapToEntity(data[0])
  }

  async findByTenantId(tenantId?: string): Promise<User[]> {
    let query;
    
    if (tenantId) {
      query = this.supabase
        .from('users')
        .select('*')
        .eq('tenant_id', tenantId);
    } else {
      query = this.withTenantFilter()
        .from('users')
        .select('*');
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to find users by tenant: ${error.message}`)
    if (!data) return []

    return data.map((item: any) => this.mapToEntity(item))
  }

  async update(id: string, data: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'>>): Promise<User> {
    const query = this.withTenantFilter()
      .from('users')
      .update({
        email: data.email,
        role: data.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      
    // Only add tenant filter if tenantId is available
    if (this.tenantId) {
      query.eq('tenant_id', this.tenantId)
    }
    
    const { data: updatedData, error } = await query.select().single()

    if (error) throw new Error(`Failed to update user: ${error.message}`)
    return this.mapToEntity(updatedData)
  }

  async delete(id: string): Promise<void> {
    if (!this.tenantId) {
      throw new Error('Tenant ID is required to delete user')
    }
    await this.deleteInternal(id)
  }

  async createWithAuth(user: {
    email: string
    password: string
    name?: string
    role: 'super_admin' | 'admin' | 'vendedor' | 'contador'
    tenantId: string
  }): Promise<User | null> {
    const adminClient = SupabaseUserRepository.createAdminClient();
    
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await adminClient.auth.signUp({
        email: user.email,
        password: user.password,
        options: {
          data: {
            tenant_id: user.tenantId,
            role: user.role,
            name: user.name
          }
        }
      });

      if (authError || !authData.user) {
        throw new Error(`Failed to create auth user: ${authError?.message}`);
      }

      // 2. Esperar a que el trigger cree el usuario en la base de datos
      let retries = 0;
      const maxRetries = 10;
      
      while (retries < maxRetries) {
        const { data: userData, error: userError } = await adminClient
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (!userError && userData) {
          return this.mapToEntity(userData);
        }

        retries++;
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 3. Si el trigger no funciona, crear manualmente
      const { data: manualUserData, error: manualError } = await adminClient
        .from('users')
        .insert([{
          id: authData.user.id,
          email: user.email,
          tenant_id: user.tenantId,
          role: user.role
        }])
        .select()
        .single();

      if (manualError) {
        // Rollback auth user
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Failed to create user record: ${manualError.message}`);
      }

      return this.mapToEntity(manualUserData);

    } catch (error) {
      throw new Error(`createWithAuth failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async findByEmailAndTenant(email: string, tenantId: string): Promise<User | null> {
    const adminClient = SupabaseUserRepository.createAdminClient();
    
    const { data, error } = await adminClient
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('tenant_id', tenantId)
      .limit(1);

    if (error) throw new Error(`Failed to find user by email and tenant: ${error.message}`);
    if (!data || data.length === 0) return null;

    return this.mapToEntity(data[0]);
  }

  async authenticate(email: string, password: string): Promise<{
    success: boolean
    user?: User
    token?: string
    error?: string
  }> {
    const adminClient = SupabaseUserRepository.createAdminClient();
    
    try {
      const { data: authData, error: authError } = await adminClient.auth.signInWithPassword({
        email,
        password
      });

      if (authError || !authData.session) {
        return {
          success: false,
          error: 'Credenciales inválidas'
        };
      }

      // Obtener datos del usuario desde la base de datos
      const { data: userData, error: userError } = await adminClient
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          error: 'Usuario no encontrado'
        };
      }

      return {
        success: true,
        user: this.mapToEntity(userData),
        token: authData.session.access_token
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en autenticación'
      };
    }
  }

  async updateRole(id: string, role: 'super_admin' | 'admin' | 'vendedor' | 'contador'): Promise<User> {
    if (!this.tenantId) {
      throw new Error('Tenant ID is required to update user role')
    }
    
    const { data, error } = await this.withTenantFilter()
      .from('users')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', this.tenantId)
      .select()
      .single()

    if (error) throw new Error(`Failed to update user role: ${error.message}`)
    return this.mapToEntity(data)
  }
}