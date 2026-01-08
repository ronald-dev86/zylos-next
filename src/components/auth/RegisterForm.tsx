'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Building2, Store, CheckCircle, AlertCircle } from 'lucide-react'
import { RegisterSchema, Register } from '@/shared/types/schemas'
import { RegistrationService } from '@/core/use-cases/RegistrationService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'

export function RegisterForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [isCheckingSubdomain, setIsCheckingSubdomain] = useState(false)
  const [subdomainAvailable, setSubdomainAvailable] = useState<boolean | null>(null)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [validationStep, setValidationStep] = useState(0) // 0: form, 1: validating, 2: processing, 3: success

  const router = useRouter()
  const registrationService = new RegistrationService()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
    trigger
  } = useForm({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
      tenant_subdomain: ''
    }
  })

  const watchedSubdomain = watch('tenant_subdomain')
  const watchedEmail = watch('email')
  const watchedName = watch('name')

  // Check availability in real-time
  useEffect(() => {
    const checkAvailability = async () => {
      if (watchedSubdomain.length >= 3 && watchedEmail.length > 0) {
        setIsCheckingSubdomain(true)
        setIsCheckingEmail(true)
        
        try {
          const availability = await registrationService.checkRegistrationAvailability(
            watchedSubdomain, 
            watchedEmail
          )
          setSubdomainAvailable(availability.subdomainAvailable)
          setEmailAvailable(availability.emailAvailable)
          console.log('Availability check:', availability)
        } catch (error) {
          setSubdomainAvailable(false)
          setEmailAvailable(false)
        } finally {
          setIsCheckingSubdomain(false)
          setIsCheckingEmail(false)
        }
      } else {
        setSubdomainAvailable(null)
        setEmailAvailable(null)
      }
    }

    const timeoutId = setTimeout(checkAvailability, 500)
    return () => clearTimeout(timeoutId)
  }, [watchedSubdomain, watchedEmail, registrationService])

  const onSubmit = async (data: Register) => {
    setIsLoading(true)
    setRegisterError(null)
    setValidationStep(1) // validating
    clearErrors()

    try {
      console.log('🚀 Submitting registration:', data)
      
      // Validate all data first
      const validationResult = await registrationService.validateRegistrationData(data)
      
      if (!validationResult.success || !validationResult.data?.isValid) {
        setRegisterError('Validation failed')
        setError('root', {
          type: 'manual',
          message: validationResult.data?.errors.join(', ') || 'Please check all fields'
        })
        setValidationStep(0)
        return
      }

      setValidationStep(2) // processing
      const result = await registrationService.registerNewBusiness(data)

      if (result.success && result.data) {
        setValidationStep(3) // success
        console.log('🎉 Registration successful:', result.data)
        
        // Redirect to login with success message
        setTimeout(() => {
          router.push('/auth/login?message=registration_success&subdomain=' + data.tenant_subdomain)
        }, 2000)
      } else {
        setRegisterError(result.message || 'Registration failed')
        setValidationStep(0)
        
        if (result.error === 'SUBDOMAIN_TAKEN') {
          setError('tenant_subdomain', {
            type: 'manual',
            message: 'This subdomain is already taken'
          })
        } else if (result.error?.includes('EMAIL')) {
          setError('email', {
            type: 'manual',
            message: 'Email already registered'
          })
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setRegisterError(errorMessage)
      setError('root', {
        type: 'manual',
        message: errorMessage
      })
      setValidationStep(0)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
          <Building2 className="h-6 w-6" />
          Create Your Zylos Account
        </CardTitle>
        <CardDescription className="text-center">
          Set up your business and start managing your inventory
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${validationStep >= 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={`text-sm ${validationStep >= 0 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Form</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${validationStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={`text-sm ${validationStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Validating</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${validationStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <span className={`text-sm ${validationStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Processing</span>
            </div>
            <div className={`flex items-center gap-2 ${validationStep === 3 ? 'text-green-600' : 'text-gray-500'}`}>
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Success</span>
            </div>
          </div>

          {/* Error general */}
          {(registerError || errors.root) && (
            <Alert variant="destructive">
              <AlertDescription>
                {registerError || errors.root?.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Business Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name">Business Name</Label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="My Business"
                disabled={isLoading}
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
            </div>
            {errors.name && (
              <p className="text-sm text-red-600">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                disabled={isLoading}
                {...register('email')}
                className={`${errors.email ? 'border-red-500' : ''} ${emailAvailable === true ? 'border-green-500' : ''} ${emailAvailable === false ? 'border-red-500' : ''}`}
              />
              {isCheckingEmail && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Spinner className="h-4 w-4" />
                </div>
              )}
              {emailAvailable && !isCheckingEmail && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {emailAvailable ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              )}
            </div>
            {errors.email && (
              <p className="text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
            {emailAvailable === false && !errors.email && (
              <p className="text-sm text-red-600">
                Email is already registered
              </p>
            )}
          </div>

          {/* Tenant Subdomain Field */}
          <div className="space-y-2">
            <Label htmlFor="tenant_subdomain">Business Subdomain</Label>
            <div className="relative">
              <Input
                id="tenant_subdomain"
                type="text"
                placeholder="mybusiness"
                disabled={isLoading}
                {...register('tenant_subdomain')}
                className={`pr-20 ${errors.tenant_subdomain ? 'border-red-500' : ''} ${subdomainAvailable === true ? 'border-green-500' : ''} ${subdomainAvailable === false ? 'border-red-500' : ''}`}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 pointer-events-none">
                .zylos.com
              </span>
              {isCheckingSubdomain && (
                <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
                  <Spinner className="h-4 w-4" />
                </div>
              )}
            </div>
            {errors.tenant_subdomain && (
              <p className="text-sm text-red-600">
                {errors.tenant_subdomain.message}
              </p>
            )}
            {subdomainAvailable !== null && !isCheckingSubdomain && watchedSubdomain.length >= 3 && (
              <p className={`text-sm ${subdomainAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {subdomainAvailable ? '✓ Subdomain available' : '✗ Subdomain already taken'}
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
                placeholder="Create a strong password"
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
            <p className="text-xs text-gray-500">
              Must contain uppercase, lowercase, and number
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                disabled={isLoading}
                {...register('confirm_password')}
                className={errors.confirm_password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-sm text-red-600">
                {errors.confirm_password.message}
              </p>
            )}
          </div>
        </CardContent>

        <div className="px-6 pb-6">
          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading || 
              isSubmitting || 
              (subdomainAvailable === false) || 
              (emailAvailable === false) ||
              (subdomainAvailable === null && watchedSubdomain.length >= 3) ||
              (emailAvailable === null && watchedEmail.length > 0)
            }
          >
            {isLoading || isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                {validationStep === 1 ? 'Validating...' :
                 validationStep === 2 ? 'Creating Business...' :
                 validationStep === 3 ? 'Created!' : 
                 'Creating Account...'}
              </>
            ) : (
              <>
                <Store className="mr-2 h-4 w-4" />
                Create Business Account
              </>
            )}
          </Button>

          <div className="mt-4 text-center text-sm">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => router.push('/auth/login')}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              disabled={isLoading}
            >
              Sign in
            </button>
          </div>

          {/* Tenant Info */}
          <div className="text-xs text-gray-500 text-center pt-2 border-t">
            Your business will be created as: {watchedName || 'your-business'}.{watchedSubdomain || 'your-subdomain'}.zylos.com
          </div>
        </div>
      </form>
    </Card>
  )
}