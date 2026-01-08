// Subdomain Value Object - Domain primitive for tenant subdomains
// Immutable value object with proper subdomain validation

export class Subdomain {
  private readonly _value: string
  private readonly _normalized: string

  constructor(subdomain: string) {
    this._value = subdomain.trim()
    this._normalized = this.normalize(this._value)
    this.validate(this._normalized)
  }

  private validate(subdomain: string): void {
    if (!subdomain || subdomain.length === 0) {
      throw new Error('Subdomain cannot be empty')
    }

    if (subdomain.length < 3) {
      throw new Error('Subdomain must be at least 3 characters long')
    }

    if (subdomain.length > 63) {
      throw new Error('Subdomain is too long (max 63 characters)')
    }

    // Subdomain validation regex
    // Allows: letters, numbers, hyphens
    // Cannot: start or end with hyphen, consecutive hyphens
    const subdomainRegex = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{1,61}[a-zA-Z0-9])?$/
    
    if (!subdomainRegex.test(subdomain)) {
      throw new Error(`Invalid subdomain format: ${subdomain}`)
    }

    // Additional validation rules
    if (subdomain.includes('--')) {
      throw new Error('Subdomain cannot contain consecutive hyphens')
    }

    if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
      throw new Error('Subdomain cannot start or end with a hyphen')
    }

    // Check for invalid characters
    if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
      throw new Error('Subdomain can only contain letters, numbers, and hyphens')
    }

    // Reserved subdomains (can't be used)
    const reservedSubdomains = [
      'www', 'mail', 'ftp', 'admin', 'administrator', 'root',
      'api', 'app', 'blog', 'shop', 'store', 'support', 'help',
      'test', 'dev', 'staging', 'production', 'demo', 'example',
      'localhost', 'm', 'mobile', 'wap', 'web', 'www2', 'secure',
      'ssl', 'tls', 'http', 'https', 'tcp', 'udp', 'dns', 'mx',
      'ns1', 'ns2', 'ns3', 'ns4', 'ns', 'pop', 'pop3', 'imap',
      'smtp', 'mail2', 'email', 'cdn', 'static', 'assets', 'media',
      'images', 'img', 'css', 'js', 'scripts', 'files', 'upload',
      'downloads', 'backup', 'db', 'database', 'sql', 'mysql',
      'postgres', 'redis', 'cache', 'search', 'elastic', 'log',
      'logs', 'monitoring', 'metrics', 'stats', 'analytics',
      'dashboard', 'panel', 'cpanel', 'control', 'manage',
      'account', 'accounts', 'user', 'users', 'auth', 'oauth',
      'login', 'signin', 'signup', 'register', 'profile',
      'settings', 'config', 'configuration', 'pref', 'preferences',
      'notification', 'notifications', 'alert', 'alerts', 'error',
      'errors', '404', '500', '503', 'maintenance', 'coming-soon',
      'under-construction', 'temp', 'temporary', 'old', 'new',
      'v1', 'v2', 'v3', 'version', 'ver', 'legacy', 'archive',
      'beta', 'alpha', 'preview', 'sandbox', 'trial', 'free',
      'premium', 'pro', 'enterprise', 'business', 'corp', 'corporate'
    ]

    if (reservedSubdomains.includes(subdomain.toLowerCase())) {
      throw new Error(`Subdomain "${subdomain}" is reserved and cannot be used`)
    }

    // Check for all-numeric subdomains
    if (/^\d+$/.test(subdomain)) {
      throw new Error('Subdomain cannot be all numbers')
    }

    // Check for common patterns that might be confused with system domains
    const systemPatterns = [
      /^.*-cdn$/, /^.*-static$/, /^.*-assets$/,
      /^.*-api$/, /^.*-admin$/, /^.*-mail$/,
      /^ns\d+$/, /^.*\d+server$/, /^.*-db$/
    ]

    for (const pattern of systemPatterns) {
      if (pattern.test(subdomain)) {
        throw new Error(`Subdomain "${subdomain}" looks like a system domain and cannot be used`)
      }
    }
  }

  private normalize(subdomain: string): string {
    // Convert to lowercase and normalize
    return subdomain.toLowerCase()
  }

  get value(): string {
    return this._value
  }

  get normalized(): string {
    return this._normalized
  }

  // Factory methods
  static fromString(subdomain: string): Subdomain {
    return new Subdomain(subdomain)
  }

  static isValid(subdomain: string): boolean {
    try {
      new Subdomain(subdomain)
      return true
    } catch {
      return false
    }
  }

  static validateAndNormalize(subdomain: string): string {
    const subdomainObj = new Subdomain(subdomain)
    return subdomainObj.normalized
  }

  // Comparison operations
  equals(other: Subdomain): boolean {
    return this._normalized === other.normalized
  }

  equalsCaseSensitive(other: Subdomain): boolean {
    return this._value === other.value
  }

  // Utility methods
  toUrl(baseDomain: string = 'zylos.com'): string {
    return `https://${this._normalized}.${baseDomain}`
  }

  toFullDomain(baseDomain: string = 'zylos.com'): string {
    return `${this._normalized}.${baseDomain}`
  }

  toDatabaseName(): string {
    // Convert subdomain to a valid database name
    return `tenant_${this._normalized.replace(/-/g, '_')}`
  }

  toSchemaName(): string {
    // Convert subdomain to a valid schema name
    return this._normalized.replace(/-/g, '_')
  }

  // Business logic methods
  isPremium(): boolean {
    // Check if this looks like a premium subdomain
    const premiumPatterns = [
      'premium', 'pro', 'enterprise', 'business', 'corp', 'corporate',
      'vip', 'gold', 'platinum', 'silver', 'diamond', 'elite'
    ]
    
    return premiumPatterns.some(pattern => 
      this._normalized.includes(pattern)
    )
  }

  isTestEnvironment(): boolean {
    const testPatterns = [
      'test', 'dev', 'development', 'staging', 'qa', 'quality',
      'demo', 'sandbox', 'beta', 'alpha', 'preview', 'temp',
      'temporary', 'experiment', 'lab', 'experimental'
    ]
    
    return testPatterns.some(pattern => 
      this._normalized.includes(pattern)
    )
  }

  isPersonal(): boolean {
    // Check if this looks like a personal subdomain
    const personalPatterns = [
      /^john-/, /^jane-/, /^user-/, /^personal-/, /^my-/i,
      /\d+$/, /^[a-z]+\d+$/ // Ends with number or letter+number
    ]
    
    return personalPatterns.some(pattern => 
      pattern.test(this._normalized)
    )
  }

  // Security methods
  getSecurityScore(): number {
    let score = 100

    // Deduct points for common patterns
    if (this._normalized.length < 5) score -= 20
    if (this._normalized.includes('admin')) score -= 30
    if (this._normalized.includes('test')) score -= 20
    if (/^\d+$/.test(this._normalized)) score -= 40
    if (this._normalized.includes('user')) score -= 15

    // Bonus points for good patterns
    if (this._normalized.length > 10) score += 10
    if (/[0-9]/.test(this._normalized)) score += 5
    if (this._normalized.split('-').length > 2) score += 5

    return Math.max(0, Math.min(100, score))
  }

  // Formatting methods
  toDisplayName(): string {
    // Convert subdomain to display name
    return this._normalized
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  toSlug(): string {
    return this._normalized
  }

  toString(): string {
    return this._value
  }

  toJSON(): string {
    return this._normalized
  }

  // Static utility methods
  static generateRandom(length: number = 8): Subdomain {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      if (i > 0 && i % 3 === 0) {
        result += '-'
      }
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    // Ensure it doesn't start or end with hyphen
    return new Subdomain(result.replace(/^-|-$/g, ''))
  }

  static fromBusinessName(businessName: string): Subdomain {
    // Convert business name to subdomain format
    const normalized = businessName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .trim()
    
    return new Subdomain(normalized)
  }

  static suggestSubdomains(businessName: string): Subdomain[] {
    const base = businessName.toLowerCase().replace(/[^a-z0-9\s]/g, '')
    const suggestions: string[] = []
    
    // Direct conversion
    suggestions.push(base.replace(/\s+/g, '-'))
    
    // With suffixes
    suggestions.push(`${base.replace(/\s+/g, '-')}-app`)
    suggestions.push(`${base.replace(/\s+/g, '-')}-store`)
    suggestions.push(`${base.replace(/\s+/g, '-')}-shop`)
    
    // Shortened versions
    if (base.length > 10) {
      suggestions.push(base.substring(0, 10).replace(/\s+/g, '-'))
    }
    
    // Filter valid ones and return first 5
    return suggestions
      .filter(Subdomain.isValid)
      .slice(0, 5)
      .map(s => new Subdomain(s))
  }
}