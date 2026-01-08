// Re-export domain Email for backward compatibility
export { Email } from '@/core/domain/value-objects/Email'

// Keep legacy wrapper for existing code
export class EmailValidator {
  static isValid(email: string): boolean {
    try {
      new Email(email)
      return true
    } catch {
      return false
    }
  }

  static normalize(email: string): string {
    return Email.normalize ? Email.normalize(email) : email.toLowerCase().trim()
  }

  static validateAndNormalize(email: string): string {
    return Email.validateAndNormalize ? Email.validateAndNormalize(email) : email.toLowerCase().trim()
  }
}