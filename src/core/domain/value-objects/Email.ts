export class Email {
  public readonly value: string

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error('Invalid email address')
    }
    this.value = value.toLowerCase()
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  toString(): string {
    return this.value
  }

  equals(other: Email): boolean {
    return this.value === other.value
  }

  get domain(): string {
    return this.value.split('@')[1] || ''
  }

  get localPart(): string {
    return this.value.split('@')[0] || ''
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