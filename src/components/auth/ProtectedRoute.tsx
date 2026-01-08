'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase-client/client'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string[]
  fallbackPath?: string
}

export function ProtectedRoute({ 
  children, 
  requiredRole = ['admin', 'super_admin'], 
  fallbackPath = '/auth/login' 
}: ProtectedRouteProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push(`${fallbackPath}?redirect=${encodeURIComponent(window.location.pathname)}`)
          return
        }

        // Verificar rol del usuario
        const { data: user } = await supabase
          .from('users')
          .select('role, tenant_id')
          .eq('id', session.user.id)
          .single()

        if (!user) {
          router.push(fallbackPath)
          return
        }

        // Verificar autorización por rol
        const hasRequiredRole = requiredRole.includes((user as any)?.role)
        if (!hasRequiredRole) {
          // Redirigir según rol
          const roleRedirects: Record<string, string> = {
            'vendedor': '/pos',
            'contador': '/accounting',
            'admin': '/dashboard',
            'super_admin': '/admin/dashboard'
          }
          
          const redirectPath = roleRedirects[(user as any)?.role] || '/dashboard'
          router.push(redirectPath)
          return
        }

        setIsAuthorized(true)
      } catch (error) {
        console.error('ProtectedRoute error:', error)
        router.push(fallbackPath)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase, requiredRole, fallbackPath])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // Se redirige en el useEffect
  }

  return <>{children}</>
}