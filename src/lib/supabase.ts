import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Service role client (for server-side admin operations)
export function createClientForServer() {
  const cookieStore = cookies()
  
  return createClient(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      }
    }
  )
}

// API route client (with auth handling)
export function createClientForRoute() {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
      }
    }
  )
}

// Server component client (with cookies)
export function createClientForComponent() {
  const cookieStore = cookies()
  
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
      },
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set(name, { value, ...options })
        },
        remove(name, options) {
          cookieStore.set(name, { ...options, value: '' })
        }
      }
    }
  )
}

// Helper to get current tenant from request headers
export const getCurrentTenant = (req?: Request | NextRequest) => {
  if (!req) return null
  
  const tenantId = req.headers.get('x-tenant-id')
  const tenantName = req.headers.get('x-tenant-name')
  const tenantSubdomain = req.headers.get('x-tenant-subdomain')
  
  if (!tenantId) return null
  
  return {
    id: tenantId,
    name: tenantName || '',
    subdomain: tenantSubdomain || '',
  }
}

// Helper to create authenticated client with tenant context
export const createAuthenticatedClient = (req: Request | NextRequest) => {
  const tenant = getCurrentTenant(req)
  
  if (!tenant) {
    throw new Error('Tenant not found in request headers')
  }
  
  // Create client with anon key - auth will be handled via session
  const client = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
      }
    }
  )
  
  return client
}
      }
    }
  )
}

// API route client (with auth handling)
export function createClientForRoute() {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: true,
      }
    }
  )
}

// Middleware client (for tenant resolution)
export function createClientForMiddleware(req: NextRequest) {
  const res = {
    headers: new Map()
  }
  
  return createMiddlewareClient({ req, res })
}

// Helper to get current tenant from request headers
export const getCurrentTenant = (req?: Request | NextRequest) => {
  if (!req) return null
  
  const tenantId = req.headers.get('x-tenant-id')
  const tenantName = req.headers.get('x-tenant-name')
  const tenantSubdomain = req.headers.get('x-tenant-subdomain')
  
  if (!tenantId) return null
  
  return {
    id: tenantId,
    name: tenantName || '',
    subdomain: tenantSubdomain || '',
  }
}

// Helper to create authenticated client with tenant context
export const createAuthenticatedClient = (req: Request | NextRequest) => {
  const tenant = getCurrentTenant(req)
  
  if (!tenant) {
    throw new Error('Tenant not found in request headers')
  }
  
  const client = createClientForRoute()
  
  // Set tenant context for the client session
  // This ensures JWT extraction works correctly in RPC functions
  client.auth.setSession({
    access_token: '', // Will be set by auth state
    refresh_token: '',
  })
  
  return client
}