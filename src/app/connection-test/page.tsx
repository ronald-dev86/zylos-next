'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/infrastructure/supabase-client/client'
import { Database } from '@/shared/types/database'

type Tenant = Database['public']['Tables']['tenants']['Row']
type Product = Database['public']['Tables']['products']['Row']

export default function ConnectionTest() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantInfo, setTenantInfo] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [tenantHeaders, setTenantHeaders] = useState<any>({})

  const supabase = createClient()

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      setLoading(true)
      setError(null)

      // 1. Test basic connection
      console.log('🔍 Testing Supabase connection...')
      
      // 2. Get tenant info from headers (set by middleware)
      const headers = new Headers()
      const response = await fetch('/api/test-headers')
      if (response.ok) {
        const headerData = await response.json()
        setTenantHeaders(headerData)
        console.log('🏷️ Tenant headers:', headerData)
      }

      // 3. Test tenant lookup (should work if middleware is working)
      const subdomain = window.location.hostname.split('.')[0]
      console.log('🌐 Subdomain detected:', subdomain)

      if (subdomain && subdomain !== 'localhost' && subdomain !== 'www') {
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('subdomain', subdomain)
          .single()

        if (tenantError) {
          console.error('❌ Tenant lookup error:', tenantError)
          setError(`Tenant lookup failed: ${tenantError.message}`)
        } else {
          console.log('✅ Tenant found:', tenant)
          setTenantInfo(tenant)
        }

        // 4. Test RLS - Try to get products for this tenant
        // This should work only if RLS and JWT context are working
        if (tenant) {
          const { data: tenantProducts, error: productsError } = await supabase
            .from('products')
            .select('*')
            .eq('tenant_id', (tenant as any)?.id)

          if (productsError) {
            console.error('❌ Products error:', productsError)
            setError(`Products query failed: ${productsError.message}`)
          } else {
            console.log('📦 Products found:', tenantProducts?.length || 0)
            setProducts(tenantProducts || [])
          }
        }
      } else {
        console.log('🏠 Landing page - no tenant context')
        // Test basic connection without tenant
        const { data: allTenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('id, name, subdomain')
          .limit(3)

        if (tenantsError) {
          setError(`Tenants query failed: ${tenantsError.message}`)
        } else {
          console.log('🏢 All tenants:', allTenants)
          setTenantInfo({ type: 'landing', tenants: allTenants })
        }
      }

    } catch (err) {
      console.error('❌ Connection test error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Testing Zylos ERP Connection...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-600 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-red-800 mb-2">Connection Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={testConnection}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🚀 Zylos ERP Connection Test</h1>
        
        {/* Connection Status */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-green-800 mb-2">✅ Connected Successfully!</h2>
          <p className="text-green-700">Supabase connection working properly</p>
        </div>

        {/* Tenant Headers */}
        {Object.keys(tenantHeaders).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">🏷️ Middleware Headers</h3>
            <div className="space-y-2 font-mono text-sm">
              <div><span className="font-semibold">x-tenant-id:</span> {tenantHeaders['x-tenant-id'] || 'Not set'}</div>
              <div><span className="font-semibold">x-tenant-name:</span> {tenantHeaders['x-tenant-name'] || 'Not set'}</div>
              <div><span className="font-semibold">x-tenant-subdomain:</span> {tenantHeaders['x-tenant-subdomain'] || 'Not set'}</div>
            </div>
          </div>
        )}

        {/* Tenant Information */}
        {tenantInfo && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🏢 Tenant Information</h3>
            {tenantInfo.type === 'landing' ? (
              <div>
                <p className="text-gray-600 mb-3">Landing Page - Available Tenants:</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tenantInfo.tenants?.map((tenant: Tenant) => (
                    <div key={tenant.id} className="border rounded p-3 bg-gray-50">
                      <div className="font-semibold">{tenant.name}</div>
                      <div className="text-sm text-gray-600">{tenant.subdomain}.zylos.com</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div><span className="font-semibold">ID:</span> {tenantInfo.id}</div>
                <div><span className="font-semibold">Name:</span> {tenantInfo.name}</div>
                <div><span className="font-semibold">Subdomain:</span> {tenantInfo.subdomain}</div>
              </div>
            )}
          </div>
        )}

        {/* Products */}
        {products.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">📦 Products (RLS Test)</h3>
            <div className="text-sm text-gray-600 mb-4">
              Found {products.length} products - RLS is working if you see only tenant-specific data
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-blue-600 hover:text-blue-800">Check Stock</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={testConnection}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Refresh Connection
          </button>
          <a 
            href={`http://demo.localhost:3000/`}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 inline-block"
          >
            🏪 Test Demo Tenant
          </a>
        </div>
      </div>
    </div>
  )
}