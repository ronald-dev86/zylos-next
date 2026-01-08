'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { LoginSchema, Login } from '@/shared/types/schemas'
import { AuthService } from '@/core/use-cases/AuthService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

interface LoginFormProps {
  onSuccess?: (redirectUrl: string) => void
  onError?: (error: string) => void
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginAttempts, setLoginAttempts] = useState(0)
  
  const router = useRouter()
  const authService = new AuthService()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors
  } = useForm({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember_me: false
    }
  })

  const onSubmit = async (data: Login) => {
    setIsLoading(true)
    setLoginError(null)
    clearErrors()

    try {
      const result = await authService.login(data)

      if (result.success && result.data) {
        // Login exitoso
        setLoginAttempts(0) // Resetear contador de intentos
        
        if (onSuccess) {
          onSuccess(result.data.redirect_url)
        } else {
          router.push(result.data.redirect_url)
        }
      } else {
        // Login fallido
        setLoginAttempts(prev => prev + 1)
        setLoginError(result.message || 'Login failed')
        
        // Manejar tipos específicos de error
        if (result.error === 'ACCOUNT_LOCKED') {
          setError('root', {
            type: 'manual',
            message: result.message
          })
        } else if (result.error === 'INVALID_CREDENTIALS') {
          setError('password', {
            type: 'manual',
            message: 'Invalid password'
          })
          setError('email', {
            type: 'manual',
            message: 'Invalid email or password'
          })
        } else if (result.error === 'EMAIL_NOT_CONFIRMED') {
          setError('email', {
            type: 'manual',
            message: 'Email not confirmed'
          })
        }

        if (onError) {
          onError(result.message || 'Login failed')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setLoginError(errorMessage)
      setError('root', {
        type: 'manual',
        message: errorMessage
      })
      
      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = () => {
    router.push('/auth/forgot-password')
  }

  const handleRegister = () => {
    router.push('/auth/register')
  }

  // Determinar si mostrar advertencia de intentos
  const showAttemptsWarning = loginAttempts >= 3
  const remainingAttempts = Math.max(0, 5 - loginAttempts)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Sign in to Zylos
        </CardTitle>
        <CardDescription className="text-center">
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Error general */}
          {(loginError || errors.root) && (
            <Alert variant="destructive">
              <AlertDescription>
                {loginError || errors.root?.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Advertencia de intentos fallidos */}
          {showAttemptsWarning && (
            <Alert variant="warning">
              <AlertDescription>
                {remainingAttempts} login attempts remaining. 
                After 5 failed attempts, your account will be temporarily locked.
              </AlertDescription>
            </Alert>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              disabled={isLoading}
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                disabled={isLoading}
                {...register('password')}
                className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember_me"
              disabled={isLoading}
              {...register('remember_me')}
            />
            <Label htmlFor="remember_me" className="text-sm">
              Remember me for 30 days
            </Label>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4">
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          {/* Action Links */}
          <div className="flex flex-col space-y-2 text-sm text-center">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-blue-600 hover:text-blue-800 hover:underline"
              disabled={isLoading}
            >
              Forgot your password?
            </button>
            
            <div className="flex items-center justify-center space-x-1">
              <span>Don't have an account?</span>
              <button
                type="button"
                onClick={handleRegister}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                disabled={isLoading}
              >
                Sign up
              </button>
            </div>
          </div>

          {/* Tenant Info */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Signing into: {window.location.hostname}
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

export default LoginForm