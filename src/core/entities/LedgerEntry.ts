export class LedgerEntry {
  public readonly id: string
  public readonly tenantId: string
  public readonly entityType: string
  public readonly entityId: string
  public readonly type: 'debit' | 'credit'
  public readonly amount: number
  public readonly description: string
  public readonly referenceId?: string
  public readonly createdAt: Date
  public readonly updatedAt: Date

  constructor(data: {
    id: string
    tenantId: string
    entityType: string
    entityId: string
    type: 'debit' | 'credit'
    amount: number
    description: string
    referenceId?: string
    createdAt: Date
    updatedAt: Date
  }) {
    this.id = data.id
    this.tenantId = data.tenantId
    this.entityType = data.entityType
    this.entityId = data.entityId
    this.type = data.type
    this.amount = data.amount
    this.description = data.description
    this.referenceId = data.referenceId
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  static create(data: {
    entityType: string
    entityId: string
    type: 'debit' | 'credit'
    amount: number
    description: string
    referenceId?: string
  }, tenantId: string): Omit<LedgerEntry, 'id' | 'createdAt' | 'updatedAt' | 'tenantId'> {
    return {
      entityType: data.entityType,
      entityId: data.entityId,
      type: data.type,
      amount: data.amount,
      description: data.description,
      referenceId: data.referenceId
    } as LedgerEntry
  }

  isDebit(): boolean {
    return this.type === 'debit'
  }

  isCredit(): boolean {
    return this.type === 'credit'
  }
}