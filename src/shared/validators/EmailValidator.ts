export class EmailValidator {
  private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  static isValid(email: string): boolean {
    if (!email || typeof email !== 'string') {
      return false
    }
    
    const trimmedEmail = email.trim()
    if (trimmedEmail.length === 0) {
      return false
    }
    
    return this.EMAIL_REGEX.test(trimmedEmail)
  }

  static normalize(email: string): string {
    return email.toLowerCase().trim()
  }

  static validateAndNormalize(email: string): string {
    if (!this.isValid(email)) {
      throw new Error('Invalid email format')
    }
    return this.normalize(email)
  }
}