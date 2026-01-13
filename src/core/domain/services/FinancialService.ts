import { LedgerEntry } from '@/core/entities/LedgerEntry'

export class FinancialService {
  static createDoubleEntry(
    tenantId: string,
    description: string,
    debitAccount: string,
    creditAccount: string,
    amount: number,
    referenceId?: string
  ): [LedgerEntry, LedgerEntry] {
    const now = new Date()

    const debitEntry = LedgerEntry.create({
      entityType: debitAccount,
      entityId: `transaction_${Date.now()}`,
      type: 'debit',
      amount,
      description,
      referenceId
    }, tenantId)

    const creditEntry = LedgerEntry.create({
      entityType: creditAccount,
      entityId: `transaction_${Date.now()}`,
      type: 'credit',
      amount,
      description,
      referenceId
    }, tenantId)

    // We need to return the actual LedgerEntry instances
    return [
      new LedgerEntry({ id: '', tenantId, createdAt: now, updatedAt: now, ...debitEntry }),
      new LedgerEntry({ id: '', tenantId, createdAt: now, updatedAt: now, ...creditEntry })
    ]
  }

  static calculateBalance(entries: LedgerEntry[]): number {
    return entries.reduce((balance, entry) => {
      if (entry.type === 'debit') {
        return balance - entry.amount
      } else {
        return balance + entry.amount
      }
    }, 0)
  }

  static generateFinancialReport(
    revenueEntries: LedgerEntry[],
    expenseEntries: LedgerEntry[]
  ): {
    totalRevenue: number
    totalExpenses: number
    netIncome: number
    profitMargin: number
  } {
    const totalRevenue = revenueEntries
      .filter(entry => entry.type === 'credit')
      .reduce((sum, entry) => sum + entry.amount, 0)

    const totalExpenses = expenseEntries
      .filter(entry => entry.type === 'debit')
      .reduce((sum, entry) => sum + entry.amount, 0)

    const netIncome = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      profitMargin
    }
  }
}