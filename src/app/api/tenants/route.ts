import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/infrastructure/supabase-client/client'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Obtener todos los tenants activos para testing
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, name, subdomain, active')
      .eq('active', true)
      .order('subdomain', { ascending: true })

    if (error) {
      console.error('Error fetching tenants:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tenants' },
        { status: 500 }
      )
    }

    // Generar escenarios de test dinámicamente basados en tenants reales
    const testScenarios = generateTestScenarios(tenants || [])

    return NextResponse.json({
      tenants,
      testScenarios,
      total: tenants?.length || 0
    })

  } catch (error) {
    console.error('Exception in tenants API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Genera escenarios de test basados en los tenants reales de la BD
 */
function generateTestScenarios(tenants: any[]) {
  const scenarios = []
  
  // Escenario 1: Landing page (sin subdominio)
  scenarios.push({
    id: 'landing',
    name: 'Landing Page (No Subdomain)',
    url: 'http://localhost:3000/api/test-headers',
    expectedSubdomain: null,
    description: 'Debe mostrar landing page sin tenant context',
    type: 'landing'
  })

  // Escenario 2: IP address (sin subdominio)
  scenarios.push({
    id: 'ip-address',
    name: 'IP Address (No Subdomain)',
    url: 'http://127.0.0.1:3000/api/test-headers',
    expectedSubdomain: null,
    description: 'IP debe ir a landing sin tenant context',
    type: 'landing'
  })

  // Escenario 3: WWW redirect (sin subdominio)
  scenarios.push({
    id: 'www-redirect',
    name: 'WWW Redirect (No Subdomain)',
    url: 'http://www.localhost:3000/api/test-headers',
    expectedSubdomain: null,
    description: 'www debe ser tratado como landing page',
    type: 'landing'
  })

  // Escenario 4-6: Escenarios para cada tenant real
  tenants.forEach((tenant) => {
    scenarios.push({
      id: `tenant-${tenant.subdomain}`,
      name: `Tenant: ${tenant.name} (${tenant.subdomain})`,
      url: `http://${tenant.subdomain}.localhost:3000/api/test-headers`,
      expectedSubdomain: tenant.subdomain,
      description: `Debe detectar subdominio ${tenant.subdomain} y cargar tenant ${tenant.name}`,
      type: 'tenant',
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain
      }
    })
  })

  // Escenario final: Subdominio inválido
  scenarios.push({
    id: 'invalid-subdomain',
    name: 'Invalid Subdomain (404)',
    url: 'http://nonexistent.localhost:3000/api/test-headers',
    expectedSubdomain: null,
    description: 'Subdominio no existente debe mostrar 404',
    type: 'error'
  })

  return scenarios
}