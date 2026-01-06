'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/infrastructure/supabase-client/client'

interface TestResult {
  scenario: string
  url: string
  expected: string
  actual: string
  status: 'success' | 'error' | 'pending'
}

export default function MiddlewareTestSuite() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const scenarios = [
    {
      name: 'Landing Page (no subdomain)',
      url: 'http://localhost:3000/api/test-headers',
      expectedSubdomain: null,
      description: 'Debe ir a landing sin tenant context'
    },
    {
      name: 'Demo Tenant',
      url: 'http://demo.localhost:3000/api/test-headers',
      expectedSubdomain: 'demo',
      description: 'Debe detectar subdominio demo'
    },
    {
      name: 'Test Tenant',
      url: 'http://test.localhost:3000/api/test-headers',
      expectedSubdomain: 'test',
      description: 'Debe detectar subdominio test'
    },
    {
      name: 'WWW Redirect (no subdomain)',
      url: 'http://www.localhost:3000/api/test-headers',
      expectedSubdomain: null,
      description: 'www debe ser tratado como landing'
    },
    {
      name: 'IP Address (no subdomain)',
      url: 'http://127.0.0.1:3000/api/test-headers',
      expectedSubdomain: null,
      description: 'IP debe ir a landing sin subdominio'
    },
    {
      name: 'Custom Domain',
      url: 'http://store.example.com/api/test-headers',
      expectedSubdomain: 'store',
      description: 'Dominio personalizado debe extraer subdominio'
    },
    {
      name: 'Nested Subdomain',
      url: 'http://api.store.example.com/api/test-headers',
      expectedSubdomain: 'api',
      description: 'Subdominios anidados deben funcionar'
    },
    {
      name: 'Reserved Subdomain (blocked)',
      url: 'http://admin.localhost:3000/api/test-headers',
      expectedSubdomain: null,
      description: 'Subdominios reservados deben ser bloqueados'
    }
  ]

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    const results: TestResult[] = []
    
    for (const scenario of scenarios) {
      const result: TestResult = {
        scenario: scenario.name,
        url: scenario.url,
        expected: scenario.expectedSubdomain || 'null',
        actual: '',
        status: 'pending'
      }
      
      try {
        const response = await fetch(scenario.url, {
          headers: {
            'Host': new URL(scenario.url).host
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          result.actual = data['x-tenant-subdomain'] || 'null'
          result.status = result.actual === result.expected ? 'success' : 'error'
        } else {
          result.actual = 'ERROR'
          result.status = 'error'
        }
      } catch (error) {
        result.actual = 'FAILED'
        result.status = 'error'
      }
      
      results.push(result)
      
      // Pequeña pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    setTestResults(results)
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'pending': return '⏳'
      default: return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50'
      case 'error': return 'text-red-600 bg-red-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Middleware Dynamic Subdomain Test Suite</h1>
        <p className="text-gray-600 mb-8">Validando extracción 100% dinámica de subdominios sin hardcoding</p>
        
        <div className="mb-8">
          <button
            onClick={runTests}
            disabled={isRunning}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running Tests...
              </>
            ) : (
              '🚀 Run All Tests'
            )}
          </button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">📊 Test Results</h2>
              <div className="text-sm text-gray-600">
                Success: {testResults.filter(r => r.status === 'success').length} / {testResults.length}
              </div>
            </div>

            <div className="grid gap-4">
              {testResults.map((result, index) => (
                <div key={index} className={`border rounded-lg p-6 ${getStatusColor(result.status)}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        {getStatusIcon(result.status)} {result.scenario}
                      </h3>
                      <p className="text-sm opacity-75 mb-3">{result.url}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      result.status === 'success' ? 'bg-green-100 text-green-800' :
                      result.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.status.toUpperCase()}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-sm">
                    <div>
                      <span className="font-semibold">Expected:</span> {result.expected}
                    </div>
                    <div>
                      <span className="font-semibold">Actual:</span> {result.actual}
                    </div>
                    <div>
                      <span className="font-semibold">Result:</span> {result.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Scenarios Info */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🧪 Test Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scenarios.map((scenario, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-800">{scenario.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{scenario.description}</p>
                <p className="text-xs text-gray-500 mt-2 font-mono">
                  Expected subdomain: {scenario.expectedSubdomain || 'null'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Implementation Details */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🏗️ Implementation Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">✅ Dynamic Subdomain Extraction</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Sin valores hardcodeados</li>
                <li>• Soporte localhost y dominios reales</li>
                <li>• Manejo de puertos automáticamente</li>
                <li>• Detección de IPs sin subdominio</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">🚀 Performance Optimizations</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Cache en memoria (5 minutos TTL)</li>
                <li>• Validación de subdominios reservados</li>
                <li>• Manejo robusto de errores</li>
                <li>• Soporte para tenants activos/inactivos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}