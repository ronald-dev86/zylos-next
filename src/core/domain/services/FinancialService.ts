import { Money } from '../value-objects/Money'
import { EntityType } from '../enums'
import { LedgerEntry, type LedgerEntryData } from '../aggregates/Ledger'

export interface FinancialPeriod {
  startDate: Date
  endDate: Date
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
}

export interface FinancialMetrics {
  totalRevenue: Money
  totalExpenses: Money
  netProfit: Money
  grossMargin: number // percentage
  averageTransactionValue: Money
  transactionCount: number
  customerAcquisitionCost: Money
  customerLifetimeValue: Money
}

export interface FinancialKPIs {
  revenueGrowth: number // percentage
  profitMargin: number // percentage
  operatingEfficiency: number // ratio
  customerRetentionRate: number // percentage
  inventoryTurnover: number // ratio
}

export interface FinancialReport {
  period: FinancialPeriod
  metrics: FinancialMetrics
  kpis: FinancialKPIs
  breakdownByEntityType: {
    customers: {
      totalRevenue: Money
      totalExpenses: Money
      netBalance: Money
      activeCustomers: number
      averageCustomerValue: Money
    }
    suppliers: {
      totalPurchases: Money
      totalPayments: Money
      netBalance: Money
      activeSuppliers: number
      averageSupplierValue: Money
    }
  }
}

export class FinancialService {
  calculateMetrics(
    ledgerEntries: LedgerEntry[],
    period: FinancialPeriod
  ): FinancialMetrics {
    const periodEntries = ledgerEntries.filter(entry => 
      entry.createdAt >= period.startDate && entry.createdAt <= period.endDate
    )

    const customerEntries = periodEntries.filter(entry => entry.isCustomerEntry())
    const supplierEntries = periodEntries.filter(entry => entry.isSupplierEntry())

    const customerRevenue = customerEntries
      .filter(entry => entry.isCredit())
      .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

    const customerPayments = customerEntries
      .filter(entry => entry.isDebit())
      .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

    const supplierPurchases = supplierEntries
      .filter(entry => entry.isDebit())
      .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

    const supplierPayments = supplierEntries
      .filter(entry => entry.isCredit())
      .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

    const totalRevenue = customerRevenue
    const totalExpenses = supplierPurchases
    const netProfit = totalRevenue.subtract(totalExpenses)

    const grossMargin = totalRevenue.amount > 0 
      ? (netProfit.amount / totalRevenue.amount) * 100
      : 0

    const transactionCount = periodEntries.length
    const averageTransactionValue = transactionCount > 0
      ? totalRevenue.divide(transactionCount)
      : new Money(0)

    // Simplified calculations for customer metrics
    const activeCustomers = new Set(
      customerEntries.map(entry => entry.entityId)
    ).size

    const customerAcquisitionCost = activeCustomers > 0
      ? totalExpenses.divide(activeCustomers)
      : new Money(0)

    const customerLifetimeValue = activeCustomers > 0
      ? totalRevenue.divide(activeCustomers)
      : new Money(0)

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      grossMargin,
      averageTransactionValue,
      transactionCount,
      customerAcquisitionCost,
      customerLifetimeValue
    }
  }

  calculateKPIs(
    currentMetrics: FinancialMetrics,
    previousMetrics?: FinancialMetrics,
    inventoryTurnover: number = 12
  ): FinancialKPIs {
    let revenueGrowth = 0
    if (previousMetrics && previousMetrics.totalRevenue.amount > 0) {
      revenueGrowth = ((currentMetrics.totalRevenue.amount - previousMetrics.totalRevenue.amount) / previousMetrics.totalRevenue.amount) * 100
    }

    const profitMargin = currentMetrics.grossMargin
    const operatingEfficiency = currentMetrics.totalExpenses.amount > 0 
      ? (currentMetrics.netProfit.amount / currentMetrics.totalExpenses.amount) * 100
      : 0

    // Simplified customer retention calculation
    const customerRetentionRate = 85 // Would be calculated based on repeat business

    return {
      revenueGrowth,
      profitMargin,
      operatingEfficiency,
      customerRetentionRate,
      inventoryTurnover
    }
  }

  generateFinancialReport(
    ledgerEntries: LedgerEntry[],
    period: FinancialPeriod,
    previousMetrics?: FinancialMetrics
  ): FinancialReport {
    const metrics = this.calculateMetrics(ledgerEntries, period)
    const kpis = this.calculateKPIs(metrics, previousMetrics)

    const periodEntries = ledgerEntries.filter(entry => 
      entry.createdAt >= period.startDate && entry.createdAt <= period.endDate
    )

    const customerEntries = periodEntries.filter(entry => entry.isCustomerEntry())
    const supplierEntries = periodEntries.filter(entry => entry.isSupplierEntry())

    // Customer breakdown
    const customerRevenue = customerEntries
      .filter(entry => entry.isCredit())
      .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

    const customerPayments = customerEntries
      .filter(entry => entry.isDebit())
      .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

    const activeCustomers = new Set(customerEntries.map(entry => entry.entityId)).size
    const averageCustomerValue = activeCustomers > 0 
      ? customerRevenue.divide(activeCustomers)
      : new Money(0)

    // Supplier breakdown
    const supplierPurchases = supplierEntries
      .filter(entry => entry.isDebit())
      .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

    const supplierPayments = supplierEntries
      .filter(entry => entry.isCredit())
      .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

    const activeSuppliers = new Set(supplierEntries.map(entry => entry.entityId)).size
    const averageSupplierValue = activeSuppliers > 0 
      ? supplierPurchases.divide(activeSuppliers)
      : new Money(0)

    return {
      period,
      metrics,
      kpis,
      breakdownByEntityType: {
        customers: {
          totalRevenue: customerRevenue,
          totalExpenses: customerPayments,
          netBalance: customerRevenue.subtract(customerPayments),
          activeCustomers,
          averageCustomerValue
        },
        suppliers: {
          totalPurchases: supplierPurchases,
          totalPayments: supplierPayments,
          netBalance: supplierPurchases.subtract(supplierPayments),
          activeSuppliers,
          averageSupplierValue
        }
      }
    }
  }

  calculateCashFlow(
    ledgerEntries: LedgerEntry[],
    period: FinancialPeriod
  ): Array<{
    date: string
    openingBalance: Money
    inflow: Money
    outflow: Money
    closingBalance: Money
  }> {
    const periodEntries = ledgerEntries.filter(entry => 
      entry.createdAt >= period.startDate && entry.createdAt <= period.endDate
    )

    // Group by date
    const entriesByDate = periodEntries.reduce((groups, entry) => {
      const dateKey = entry.createdAt.toISOString().split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(entry)
      return groups
    }, {} as Record<string, typeof periodEntries>)

    return Object.entries(entriesByDate).map(([date, dayEntries]) => {
      const openingBalance = new Money(0) // Would need previous day's closing balance
      const inflow = dayEntries
        .filter(entry => entry.isCustomerEntry() && entry.isCredit())
        .reduce((sum, entry) => sum.add(entry.amount), new Money(0))
      
      const outflow = dayEntries
        .filter(entry => entry.isSupplierEntry() && entry.isDebit())
        .reduce((sum, entry) => sum.add(entry.amount), new Money(0))

      const closingBalance = openingBalance.add(inflow).subtract(outflow)

      return {
        date,
        openingBalance,
        inflow,
        outflow,
        closingBalance
      }
    })
  }

  forecastRevenue(
    historicalRevenue: Array<{ period: FinancialPeriod; revenue: Money }>,
    futurePeriods: FinancialPeriod[]
  ): Array<{
    period: FinancialPeriod
    forecast: Money
    confidence: number
  }> {
    // Simplified linear regression forecast
    if (historicalRevenue.length < 2) {
      return futurePeriods.map(period => ({
        period,
        forecast: new Money(0),
        confidence: 0
      }))
    }

    // Calculate growth rate
    const growthRate = historicalRevenue.length >= 2
      ? (historicalRevenue[1].revenue.amount - historicalRevenue[0].revenue.amount) / historicalRevenue[0].revenue.amount
      : 0

    return futurePeriods.map((period, index) => {
      // Apply growth with decreasing confidence
      const factor = Math.pow(1 + growthRate, index + 1)
      const lastRevenue = historicalRevenue[historicalRevenue.length - 1].revenue
      const forecast = lastRevenue.multiply(factor)
      
      const confidence = Math.max(0, 100 - (index * 10)) // Confidence decreases over time

      return {
        period,
        forecast,
        confidence
      }
    })
  }
}