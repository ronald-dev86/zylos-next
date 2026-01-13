// Custom Error Types - Domain-specific error handling
// Provides proper error categorization and context

// Base application error class
export abstract class ApplicationError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly details?: Record<string, any>
  public readonly timestamp: Date
  public readonly context?: Record<string, any>

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    details?: Record<string, any>,
    context?: Record<string, any>
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date()
    this.context = context

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      context: this.context
    }
  }
}

// Validation Errors - 400 Bad Request
export class ValidationError extends ApplicationError {
  constructor(message: string, field?: string, value?: any) {
    super(
      message,
      'VALIDATION_ERROR',
      400,
      field ? { field, value } : undefined
    )
  }
}

export class RequiredFieldError extends ValidationError {
  constructor(fieldName: string) {
    super(`Field '${fieldName}' is required`, fieldName)
  }
}

export class InvalidFormatError extends ValidationError {
  constructor(fieldName: string, expectedFormat: string, actualValue?: any) {
    super(
      `Field '${fieldName}' must be in ${expectedFormat} format`,
      fieldName,
      actualValue
    )
  }
}

export class InvalidEmailError extends ValidationError {
  constructor(email: string) {
    super('Invalid email address format', 'email', email)
  }
}

export class InvalidURLError extends ValidationError {
  constructor(url: string) {
    super('Invalid URL format', 'url', url)
  }
}

export class InvalidUUIDError extends ValidationError {
  constructor(id: string) {
    super('Invalid UUID format', 'id', id)
  }
}

// Business Logic Errors - 422 Unprocessable Entity
export class BusinessRuleError extends ApplicationError {
  constructor(message: string, code?: string, details?: Record<string, any>) {
    super(
      message,
      code || 'BUSINESS_RULE_VIOLATION',
      422,
      details
    )
  }
}

export class InsufficientStockError extends BusinessRuleError {
  constructor(productId: string, requested: number, available: number) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`,
      'INSUFFICIENT_STOCK',
      { productId, requested, available }
    )
  }
}

export class CreditLimitExceededError extends BusinessRuleError {
  constructor(customerId: string, creditLimit: number, attemptedAmount: number) {
    super(
      `Credit limit exceeded for customer ${customerId}. Limit: ${creditLimit}, Attempted: ${attemptedAmount}`,
      'CREDIT_LIMIT_EXCEEDED',
      { customerId, creditLimit, attemptedAmount }
    )
  }
}

export class PaymentExceedsBalanceError extends BusinessRuleError {
  constructor(customerId: string, balance: number, paymentAmount: number) {
    super(
      `Payment amount exceeds customer balance for customer ${customerId}. Balance: ${balance}, Payment: ${paymentAmount}`,
      'PAYMENT_EXCEEDS_BALANCE',
      { customerId, balance, paymentAmount }
    )
  }
}

export class DuplicateResourceError extends BusinessRuleError {
  constructor(resourceType: string, identifier: string) {
    super(
      `${resourceType} with identifier '${identifier}' already exists`,
      'DUPLICATE_RESOURCE',
      { resourceType, identifier }
    )
  }
}

export class ResourceNotFoundError extends BusinessRuleError {
  constructor(resourceType: string, identifier: string) {
    super(
      `${resourceType} with identifier '${identifier}' not found`,
      'RESOURCE_NOT_FOUND',
      { resourceType, identifier }
    )
  }
}

export class InvalidStateError extends BusinessRuleError {
  constructor(resourceType: string, currentState: string, requiredState: string) {
    super(
      `${resourceType} is in '${currentState}' state but requires '${requiredState}' state`,
      'INVALID_STATE',
      { resourceType, currentState, requiredState }
    )
  }
}

// Permission/Authorization Errors - 403 Forbidden
export class PermissionError extends ApplicationError {
  constructor(action: string, resource: string) {
    super(
      `Insufficient permissions to perform '${action}' on resource '${resource}'`,
      'PERMISSION_DENIED',
      403,
      { action, resource }
    )
  }
}

export class RoleError extends ApplicationError {
  constructor(action: string, requiredRole: string, currentRole: string) {
    super(
      `Action '${action}' requires '${requiredRole}' role, but current role is '${currentRole}'`,
      'INSUFFICIENT_ROLE',
      403,
      { action, requiredRole, currentRole }
    )
  }
}

export class TenantAccessError extends ApplicationError {
  constructor(tenantId: string, userId: string) {
    super(
      `User '${userId}' does not have access to tenant '${tenantId}'`,
      'TENANTY_ACCESS_DENIED',
      403,
      { tenantId, userId }
    )
  }
}

// Authentication Errors - 401 Unauthorized
export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class InvalidCredentialsError extends AuthenticationError {
  constructor() {
    super('Invalid username or password')
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor(tokenType: string = 'Authentication') {
    super(`${tokenType} token has expired`)
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor(tokenType: string = 'Authentication') {
    super(`Invalid ${tokenType} token`)
  }
}

// Repository/Database Errors - 500 Internal Server Error
export class RepositoryError extends ApplicationError {
  constructor(operation: string, entity: string, originalError?: Error) {
    super(
      `Database operation '${operation}' failed for entity '${entity}'`,
      'REPOSITORY_ERROR',
      500,
      originalError ? { originalError: originalError.message } : undefined,
      { operation, entity }
    )
  }
}

export class ConnectionError extends ApplicationError {
  constructor(database: string, originalError?: Error) {
    super(
      `Failed to connect to database '${database}'`,
      'CONNECTION_ERROR',
      503,
      originalError ? { originalError: originalError.message } : undefined,
      { database }
    )
  }
}

export class QueryError extends ApplicationError {
  constructor(query: string, originalError?: Error) {
    super(
      `Failed to execute query: ${query}`,
      'QUERY_ERROR',
      500,
      { query, originalError: originalError?.message }
    )
  }
}

// Configuration Errors - 500 Internal Server Error
export class ConfigurationError extends ApplicationError {
  constructor(configKey: string, expectedValue?: string) {
    super(
      `Missing or invalid configuration for '${configKey}'`,
      'CONFIGURATION_ERROR',
      500,
      { configKey, expectedValue }
    )
  }
}

export class EnvironmentError extends ConfigurationError {
  constructor(envVar: string) {
    super(`Environment variable '${envVar}'`)
  }
}

// Integration/External Service Errors - 502 Bad Gateway
export class ExternalServiceError extends ApplicationError {
  constructor(
    serviceName: string,
    operation: string,
    originalError?: Error
  ) {
    super(
      `External service '${serviceName}' failed during operation '${operation}'`,
      'EXTERNAL_SERVICE_ERROR',
      502,
      originalError ? { originalError: originalError.message } : undefined
    )
  }
}

export class PaymentGatewayError extends ApplicationError {
  constructor(gateway: string, transactionId?: string, originalError?: Error) {
    super(
      `Payment gateway '${gateway}' error`,
      'PAYMENT_GATEWAY_ERROR',
      502,
      { gateway, transactionId, originalError: originalError?.message }
    )
  }
}

export class EmailServiceError extends ApplicationError {
  constructor(provider: string, operation: string, originalError?: Error) {
    super(
      `Email service '${provider}' failed during ${operation}`,
      'EMAIL_SERVICE_ERROR',
      502,
      { provider, operation, originalError: originalError?.message }
    )
  }
}

// Rate Limiting Errors - 429 Too Many Requests
export class RateLimitError extends ApplicationError {
  constructor(operation: string, limit: number, windowMs: number) {
    super(
      `Rate limit exceeded for operation '${operation}'. Limit: ${limit} per ${windowMs}ms`,
      'RATE_LIMIT_EXCEEDED',
      429,
      { operation, limit, windowMs }, undefined
    )
  }
}

// Timeout Errors - 408 Request Timeout
export class TimeoutError extends ApplicationError {
  constructor(operation: string, timeoutMs: number) {
    super(
      `Operation '${operation}' timed out after ${timeoutMs}ms`,
      'TIMEOUT_ERROR',
      408,
      { operation, timeoutMs }
    )
  }
}

// Utility functions for error handling
export const isApplicationError = (error: any): error is ApplicationError => {
  return error instanceof ApplicationError
}

export const isValidationError = (error: any): error is ValidationError => {
  return error instanceof ValidationError
}

export const isBusinessRuleError = (error: any): error is BusinessRuleError => {
  return error instanceof BusinessRuleError
}

export const isRepositoryError = (error: any): error is RepositoryError => {
  return error instanceof RepositoryError
}

export const getErrorStatusCode = (error: any): number => {
  if (isApplicationError(error)) {
    return error.statusCode
  }
  return 500 // Default to internal server error
}

export const getErrorMessage = (error: any): string => {
  if (isApplicationError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unknown error occurred'
}

export const createErrorFromUnknown = (error: any, context?: string): ApplicationError => {
  if (isApplicationError(error)) {
    return error
  }

  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return new TimeoutError(context || 'operation', 30000)
    }
    if (error.message.includes('ECONNREFUSED')) {
      return new ConnectionError('unknown', error)
    }
    return new RepositoryError(context || 'operation', 'unknown', error)
  }

  return new RepositoryError(
    context || 'unknown',
    'UNKNOWN_ERROR',
    error instanceof Error ? error : new Error(String(error))
  )
}