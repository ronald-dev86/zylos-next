// Email Value Object - Domain primitive for email addresses
// Immutable value object with proper email validation

export class Email {
  private readonly _value: string
  private readonly _normalized: string

  constructor(email: string) {
    this._value = email.trim()
    this._normalized = this.normalize(this._value)
    this.validate(this._normalized)
  }

  private validate(email: string): void {
    if (!email || email.length === 0) {
      throw new Error('Email address cannot be empty')
    }

    if (email.length > 254) {
      throw new Error('Email address is too long (max 254 characters)')
    }

    // Basic email validation using regex
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
    
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email address format: ${email}`)
    }

    // Additional checks
    const parts = email.split('@')
    if (parts.length !== 2) {
      throw new Error('Email must contain exactly one @ symbol')
    }

    const [localPart, domain] = parts
    
    if (localPart.length === 0) {
      throw new Error('Email local part cannot be empty')
    }

    if (localPart.length > 64) {
      throw new Error('Email local part is too long (max 64 characters)')
    }

    if (domain.length === 0) {
      throw new Error('Email domain cannot be empty')
    }

    if (domain.length > 253) {
      throw new Error('Email domain is too long (max 253 characters)')
    }

    // Check for consecutive dots
    if (email.includes('..')) {
      throw new Error('Email cannot contain consecutive dots')
    }

    // Check for leading/trailing dots
    if (email.startsWith('.') || email.endsWith('.')) {
      throw new Error('Email cannot start or end with a dot')
    }

    // Check for consecutive @ symbols
    if (email.includes('@@')) {
      throw new Error('Email cannot contain consecutive @ symbols')
    }
  }

  private normalize(email: string): string {
    // Convert to lowercase for normalization
    // Note: Some email systems are case-sensitive in the local part,
    // but for most business purposes, case-insensitive comparison is preferred
    return email.toLowerCase()
  }

  get value(): string {
    return this._value
  }

  get normalized(): string {
    return this._normalized
  }

  get localPart(): string {
    return this._normalized.split('@')[0]
  }

  get domain(): string {
    return this._normalized.split('@')[1]
  }

  // Factory methods
  static fromString(email: string): Email {
    return new Email(email)
  }

  static isValid(email: string): boolean {
    try {
      new Email(email)
      return true
    } catch {
      return false
    }
  }

  static validateAndNormalize(email: string): string {
    const emailObj = new Email(email)
    return emailObj.normalized
  }

  // Comparison operations
  equals(other: Email): boolean {
    return this._normalized === other.normalized
  }

  equalsCaseSensitive(other: Email): boolean {
    return this._value === other.value
  }

  // Domain operations
  hasDomain(domain: string): boolean {
    const normalizedDomain = domain.toLowerCase().trim()
    return this.domain === normalizedDomain
  }

  hasDomainIn(domains: string[]): boolean {
    return domains.some(domain => this.hasDomain(domain))
  }

  isCorporateEmail(): boolean {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'aol.com', 'icloud.com', 'protonmail.com', 'tutanota.com'
    ]
    
    return !this.hasDomainIn(personalDomains)
  }

  isDisposableEmail(): boolean {
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
      'mailinator.com', 'yopmail.com', 'throwaway.email'
    ]
    
    return this.hasDomainIn(disposableDomains)
  }

  // Utility methods
  obfuscate(): string {
    const [localPart, domain] = this._normalized.split('@')
    
    if (localPart.length <= 2) {
      return `${localPart[0]}*@${domain}`
    }
    
    const firstChar = localPart[0]
    const lastChar = localPart[localPart.length - 1]
    const stars = '*'.repeat(Math.min(localPart.length - 2, 3))
    
    return `${firstChar}${stars}${lastChar}@${domain}`
  }

  maskDomain(): string {
    const [localPart, domain] = this._normalized.split('@')
    const domainParts = domain.split('.')
    
    if (domainParts.length < 2) {
      return `${localPart}@***`
    }
    
    const tld = domainParts[domainParts.length - 1]
    const maskedDomain = `***.${tld}`
    
    return `${localPart}@${maskedDomain}`
  }

  toString(): string {
    return this._value
  }

  toJSON(): string {
    return this._value
  }

  // Static utility methods
  static fromMany(emails: string[]): Email[] {
    return emails.map(email => new Email(email))
  }

  static deduplicate(emails: Email[]): Email[] {
    const seen = new Set<string>()
    return emails.filter(email => {
      const key = email.normalized
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  static groupByDomain(emails: Email[]): Map<string, Email[]> {
    const groups = new Map<string, Email[]>()
    
    emails.forEach(email => {
      const domain = email.domain
      if (!groups.has(domain)) {
        groups.set(domain, [])
      }
      groups.get(domain)!.push(email)
    })
    
    return groups
  }
}