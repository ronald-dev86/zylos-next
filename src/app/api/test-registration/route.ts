// API endpoint to test user registration flow
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { Register } from '@/shared/types/schemas'
import { RegistrationService } from '@/core/use-cases/RegistrationService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Create test registration data
    const testRegistration: Register = {
      name: `Test Business ${Date.now()}`,
      email: `test-user-${Date.now()}@test.com`,
      password: 'TestPassword123',
      confirm_password: 'TestPassword123',
      tenant_subdomain: `test-${Date.now()}`
    }

    const registrationService = new RegistrationService()
    const result = await registrationService.registerNewBusiness(testRegistration)

    // After successful registration, verify user was created
    if (result.success) {
      const supabase = createClient()
      
      // Check if user exists in users table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id, email, tenant_id, role, created_at')
        .eq('email', testRegistration.email)
        .single()

      console.log('User record after registration:', { userRecord, userError })

      // Check if tenant exists
      const { data: tenantRecord, error: tenantError } = await supabase
        .from('tenants')
        .select('id, subdomain, name, created_at')
        .eq('subdomain', testRegistration.tenant_subdomain)
        .single()

      return NextResponse.json({
        success: true,
        message: 'Registration test completed',
        registration_result: result,
        verification: {
          user_created: !!userRecord && !userError,
          user_data: userRecord,
          user_error: userError,
          tenant_created: !!tenantRecord && !tenantError,
          tenant_data: tenantRecord,
          tenant_error: tenantError,
          role_is_admin: (userRecord as any)?.role === 'admin',
          tenant_matches: (userRecord as any)?.tenant_id === (tenantRecord as any)?.id
        }
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Registration failed',
      registration_result: result
    })

  } catch (error) {
    console.error('Registration test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Test execution failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  const supabase = createClient()
  
  // Get recent test users created in the last hour
  const { data: recentUsers, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      role,
      created_at,
      tenant:tenants(id, subdomain, name)
    `)
    .eq('role', 'admin')
    .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch test users',
      error: error.message
    }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Recent admin users',
    data: recentUsers,
    count: recentUsers?.length || 0
  })
}