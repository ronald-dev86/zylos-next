'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/infrastructure/supabase-client/client'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string[]
  fallbackPath?: string
}

export function AuthGuard({ children, requiredRole, fallbackPath = '/auth/login' }: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // No hay sesión, redirigir al login
          router.push(`${fallbackPath}?redirect=${encodeURIComponent(pathname)}`)
          return
        }

        // Verificar rol si se requiere
        if (requiredRole && requiredRole.length > 0) {
          const { data: user } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (!user || !requiredRole.includes((user as any)?.role)) {
            // Rol no autorizado, redirigir a login
            router.push(fallbackPath)
            return
          }
        }

        // Usuario autenticado y autorizado, permanecer en la página
      } catch (error) {
        console.error('AuthGuard error:', error)
        router.push(fallbackPath)
      }
    }

    checkAuth()
  }, [router, pathname, supabase, requiredRole, fallbackPath])

  // Renderizar children mientras se verifica la autenticación
  // La verificación se maneja con redirección en el useEffect
  return <>{children}</>
}