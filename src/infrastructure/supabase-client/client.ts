import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/shared/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey)
}

export function createServerClient() {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  })
}

//D8MHdnGDCquk4F4X