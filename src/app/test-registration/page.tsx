'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function RegistrationTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [recentUsers, setRecentUsers] = useState<any>(null)

  const runRegistrationTest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/test-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      setTestResults(result)
    } catch (error) {
      setTestResults({
        success: false,
        message: 'Failed to run test',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchRecentUsers = async () => {
    try {
      const response = await fetch('/api/test-registration')
      const result = await response.json()
      setRecentUsers(result)
    } catch (error) {
      setRecentUsers({
        success: false,
        message: 'Failed to fetch recent users',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Registration Flow Test</h1>
          <p className="text-gray-600 mt-2">
            Test user creation and verify admin role assignment
          </p>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Run tests to verify the registration flow creates users correctly in the users table with admin role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runRegistrationTest}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? 'Running Test...' : 'Run Registration Test'}
              </Button>
              <Button 
                onClick={fetchRecentUsers}
                variant="outline"
              >
                Fetch Recent Admin Users
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle className={testResults.success ? 'text-green-600' : 'text-red-600'}>
                Registration Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className={testResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className="font-mono text-sm">
                  {testResults.message}
                </AlertDescription>
              </Alert>

              {testResults.verification && (
                <div className="mt-4 space-y-4">
                  <h3 className="font-semibold">Verification Details:</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>User Created:</strong>{' '}
                      <span className={testResults.verification.user_created ? 'text-green-600' : 'text-red-600'}>
                        {testResults.verification.user_created ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div>
                      <strong>Tenant Created:</strong>{' '}
                      <span className={testResults.verification.tenant_created ? 'text-green-600' : 'text-red-600'}>
                        {testResults.verification.tenant_created ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div>
                      <strong>Role is Admin:</strong>{' '}
                      <span className={testResults.verification.role_is_admin ? 'text-green-600' : 'text-red-600'}>
                        {testResults.verification.role_is_admin ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                    <div>
                      <strong>Tenant Matches:</strong>{' '}
                      <span className={testResults.verification.tenant_matches ? 'text-green-600' : 'text-red-600'}>
                        {testResults.verification.tenant_matches ? '✅ Yes' : '❌ No'}
                      </span>
                    </div>
                  </div>

                  {testResults.verification.user_data && (
                    <div>
                      <h4 className="font-semibold mt-4">User Record:</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(testResults.verification.user_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {testResults.verification.tenant_data && (
                    <div>
                      <h4 className="font-semibold mt-4">Tenant Record:</h4>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify(testResults.verification.tenant_data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {testResults.error && (
                <div className="mt-4">
                  <h4 className="font-semibold text-red-600">Error:</h4>
                  <pre className="bg-red-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify(testResults.error, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Users */}
        {recentUsers && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Admin Users</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  Found {recentUsers.count} admin users created in the last hour
                </AlertDescription>
              </Alert>

              {recentUsers.data && recentUsers.data.length > 0 ? (
                <div className="space-y-3">
                  {recentUsers.data.map((user: any) => (
                    <div key={user.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Email:</strong> {user.email}
                        </div>
                        <div>
                          <strong>Role:</strong>{' '}
                          <span className="text-blue-600 font-medium">{user.role}</span>
                        </div>
                        <div>
                          <strong>Tenant:</strong> {user.tenant?.name} ({user.tenant?.subdomain})
                        </div>
                        <div>
                          <strong>Created:</strong>{' '}
                          {new Date(user.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No admin users found in the last hour
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}