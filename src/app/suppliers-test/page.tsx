'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/Button'
import { Card } from '@/shared/components/Card'
import { ApiResponse } from '@/shared/types/schemas'

interface TestResult {
  scenario: string
  description: string
  endpoint: string
  result: 'success' | 'error' | 'pending'
  message: string
  details?: any
  duration?: number
}

export default function SupplierModuleTestSuite() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentTest, setCurrentTest] = useState<string>('')

  const testScenarios = [
    {
      id: 'create-supplier-valid',
      name: '✅ Create Valid Supplier',
      description: 'Create supplier with valid data',
      endpoint: 'POST /api/suppliers',
      payload: {
        name: 'Test Supplier Corp',
        email: 'test@example.com',
        phone: '+1-234-567-8900',
        address: '123 Test St, Test City'
      }
    },
    {
      id: 'create-supplier-duplicate-email',
      name: '🔄 Duplicate Email Test',
      description: 'Try to create supplier with existing email',
      endpoint: 'POST /api/suppliers',
      payload: {
        name: 'Another Supplier',
        email: 'test@example.com', // Duplicate
        phone: '+1-234-567-8901',
        address: '456 Duplicate St'
      }
    },
    {
      id: 'create-supplier-invalid-data',
      name: '❌ Invalid Data Test',
      description: 'Create supplier with invalid data (missing name)',
      endpoint: 'POST /api/suppliers',
      payload: {
        email: 'invalid@example.com',
        phone: '+1-234-567-8902',
        address: '789 Invalid St'
        // Missing 'name' field
      }
    },
    {
      id: 'get-suppliers-list',
      name: '📋 Get Suppliers List',
      description: 'Retrieve suppliers list with pagination',
      endpoint: 'GET /api/suppliers',
      payload: null
    },
    {
      id: 'get-supplier-by-id',
      name: '🔍 Get Supplier by ID',
      description: 'Retrieve specific supplier by ID',
      endpoint: 'GET /api/suppliers/[id]',
      payload: null,
      requiresId: true
    },
    {
      id: 'get-suppliers-with-debt',
      name: '💳 Filter Suppliers with Debt',
      description: 'Get only suppliers with outstanding balance',
      endpoint: 'GET /api/suppliers?has_debt=true',
      payload: null
    },
    {
      id: 'search-suppliers',
      name: '🔎 Search Suppliers',
      description: 'Search suppliers by name/email',
      endpoint: 'GET /api/suppliers?search=Test',
      payload: null
    },
    {
      id: 'update-supplier',
      name: '✏️ Update Supplier',
      description: 'Update existing supplier information',
      endpoint: 'PUT /api/suppliers/[id]',
      payload: {
        name: 'Updated Supplier Name',
        phone: '+1-234-567-8999'
      },
      requiresId: true
    },
    {
      id: 'delete-supplier-with-balance',
      name: '🚫 Delete with Balance Test',
      description: 'Try to delete supplier with outstanding balance (should fail)',
      endpoint: 'DELETE /api/suppliers/[id]',
      payload: null,
      requiresId: true
    },
    {
      id: 'process-payment-valid',
      name: '💰 Valid Payment',
      description: 'Process payment to supplier',
      endpoint: 'POST /api/suppliers/[id]/payments',
      payload: {
        amount: 500,
        description: 'Test payment',
        payment_method: 'cash'
      },
      requiresId: true
    },
    {
      id: 'process-payment-excess',
      name: '💸 Payment Excess Test',
      description: 'Try to pay more than outstanding balance (should fail)',
      endpoint: 'POST /api/suppliers/[id]/payments',
      payload: {
        amount: 10000, // More than balance
        description: 'Excess payment test',
        payment_method: 'transfer'
      },
      requiresId: true
    }
  ]

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])
    
    const results: TestResult[] = []
    
    for (const scenario of testScenarios) {
      setCurrentTest(scenario.name)
      const startTime = Date.now()
      
      const result: TestResult = {
        scenario: scenario.name,
        description: scenario.description,
        endpoint: scenario.endpoint,
        result: 'pending',
        message: '',
        duration: 0
      }
      
      try {
        let response: Response
        let url = `/api/suppliers`
        let options: RequestInit = {}
        
        // Build URL and options based on scenario
        if (scenario.requiresId) {
          // First create a supplier to get an ID
          const createResponse = await fetch('/api/suppliers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: `Temp Supplier ${Date.now()}`,
              email: `temp${Date.now()}@test.com`,
              phone: '+1-234-567-0000',
              address: 'Temp Address'
            })
          })
          
          if (!createResponse.ok) {
            throw new Error(`Failed to create temp supplier: ${createResponse.statusText}`)
          }
          
          const createData = await createResponse.json()
          if (!createData.success) {
            throw new Error(`Failed to create temp supplier: ${createData.message}`)
          }
          
          url = `/api/suppliers/${createData.data.id}`
          
          if (scenario.endpoint.includes('payments')) {
            url = `/api/suppliers/${createData.data.id}/payments`
          }
        }
        
        // Add query params for GET requests
        if (scenario.endpoint.includes('?')) {
          url += scenario.endpoint.split('?')[1]
        }
        
        if (scenario.payload) {
          options = {
            method: scenario.endpoint.includes('POST') ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scenario.payload)
          }
        }
        
        response = await fetch(url, options)
        const duration = Date.now() - startTime
        
        if (response.ok) {
          const data = await response.json()
          result.result = data.success ? 'success' : 'error'
          result.message = data.message || 'Request completed'
          result.details = data.success ? data.data : data.error
        } else {
          result.result = 'error'
          result.message = `HTTP ${response.status}: ${response.statusText}`
          result.details = await response.text()
        }
        
        result.duration = duration
        
      } catch (error) {
        result.result = 'error'
        result.message = error instanceof Error ? error.message : 'Unknown error'
        result.duration = Date.now() - startTime
      }
      
      results.push(result)
      
      // Pequeña pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    setTestResults(results)
    setCurrentTest('')
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

  const getAverageResponseTime = () => {
    const validTimes = testResults
      .filter(r => r.duration && r.duration > 0)
      .map(r => r.duration!)
    
    if (validTimes.length === 0) return 0
    
    const sum = validTimes.reduce((acc, time) => acc + time, 0)
    return Math.round(sum / validTimes.length)
  }

  const successCount = testResults.filter(r => r.result === 'success').length
  const errorCount = testResults.filter(r => r.result === 'error').length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 Supplier Module Test Suite</h1>
        <p className="text-gray-600 mb-8">Complete CRUD validation and account current logic testing</p>
        
        {/* Test Controls */}
        <div className="mb-8">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {currentTest ? `Running: ${currentTest}` : 'Running All Tests...'}
              </>
            ) : (
              '🚀 Run Module Tests'
            )}
          </Button>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-6">
            {/* Summary Stats */}
            <Card className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Test Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{successCount}</div>
                  <div className="text-sm text-gray-600">Success</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{errorCount}</div>
                  <div className="text-sm text-gray-600">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{getAverageResponseTime()}ms</div>
                  <div className="text-sm text-gray-600">Avg Response</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{testResults.length}</div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
              </div>
            </Card>

            {/* Individual Test Results */}
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <Card key={index} className={`${getStatusColor(result.result)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg mb-2">
                        {getStatusIcon(result.result)} {result.scenario}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">{result.description}</p>
                      <p className="text-xs font-mono text-gray-500">
                        {result.endpoint}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {result.duration}ms
                      </div>
                      <div className={`text-xs px-2 py-1 rounded ${
                        result.result === 'success' ? 'bg-green-100 text-green-800' :
                        result.result === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {result.result.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Result Details */}
                  <div className="border-t pt-3">
                    <div className="text-sm">
                      <div className="font-medium">Message:</div>
                      <div className={result.result === 'error' ? 'text-red-600' : 'text-green-600'}>
                        {result.message}
                      </div>
                    </div>
                    
                    {result.details && (
                      <div className="text-sm mt-2">
                        <div className="font-medium">Details:</div>
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Test Scenarios Info */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🧪 Test Scenarios</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {testScenarios.map((scenario) => (
              <div key={scenario.id} className="border-l-4 border-blue-500 pl-4">
                <h4 className="font-semibold text-gray-800">{scenario.name}</h4>
                <p className="text-gray-600 mt-1">{scenario.description}</p>
                <p className="text-xs text-gray-500 mt-2 font-mono">
                  {scenario.endpoint}
                </p>
                {scenario.payload && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Payload
                    </summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-2">
                      {JSON.stringify(scenario.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}