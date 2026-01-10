import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/shared/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ⚠️ SERVER-ONLY: Solo debe usarse en API routes
export function createServerClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}

// ❌ BLOQUEADO: No se debe usar createClient desde el frontend
// export function createClient() {
//   throw new Error('createClient() solo debe usarse en servidor. Usa API routes para acceder a Supabase.');
// }

//D8MHdnGDCquk4F4X