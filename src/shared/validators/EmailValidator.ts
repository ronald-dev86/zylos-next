// Import Email value object
import { Email } from '@/core/domain/value-objects/Email'

// Re-export domain Email for backward compatibility
export { Email }

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
    try {
      const emailObj = new Email(email)
      return emailObj.toString()
    } catch {
      return email.toLowerCase().trim()
    }
  }

  static validateAndNormalize(email: string): string {
    const emailObj = new Email(email)
    return emailObj.toString()
  }
}