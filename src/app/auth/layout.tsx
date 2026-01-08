'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase-client/client'
import { LoginForm } from '@/components/auth/LoginForm'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Usuario ya autenticado, redirigir al dashboard
          const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

          const role = (user as any)?.role || 'admin'
          const roleRedirects: Record<string, string> = {
            'super_admin': '/admin/dashboard',
            'admin': '/dashboard',
            'vendedor': '/pos',
            'contador': '/accounting'
          }
          
          router.push(roleRedirects[role] || '/dashboard')
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}