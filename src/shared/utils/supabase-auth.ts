import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/shared/types/database';

/**
 * Cliente Supabase para operaciones de autenticación
 * Usa service role keys para mayor seguridad
 */
class SupabaseAuthClient {
  private client: SupabaseClient<Database>;

  constructor() {
    this.client = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  /**
   * Autentica usuario con email y contraseña
   */
  async signInWithEmail(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Refresca token de usuario
   */
  async refreshToken(refreshToken: string) {
    const { data, error } = await this.client.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (error) {
      throw new Error(`Token refresh failed: ${error.message}`);
    }

    return data;
  }

  /**
   * Cierra sesión del usuario
   */
  async signOut() {
    const { error } = await this.client.auth.signOut();
    
    if (error) {
      throw new Error(`Sign out failed: ${error.message}`);
    }
  }

  /**
   * Verifica si el token es válido
   */
  async verifyToken(token: string) {
    const { data: { user }, error } = await this.client.auth.getUser(token);

    if (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }

    return user;
  }
}

// Exportar singleton
export const supabaseAuth = new SupabaseAuthClient();