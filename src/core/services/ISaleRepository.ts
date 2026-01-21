import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export interface SaleLineItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Sale {
  id: string
  tenantId: string
  customerId: string
  customerName?: string
  items: SaleLineItem[]
  subtotal: number
  tax?: number
  total: number
  status: 'pending' | 'completed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'refunded'
  createdAt: Date
  updatedAt: Date
}

export interface CreateSaleData {
  customerId: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
  }>
  tax?: number
}

export interface ISaleRepository {
  create(sale: CreateSaleData): Promise<Sale>
  findById(id: string): Promise<Sale | null>
  findByCustomerId(customerId: string, pagination: PaginationParams): Promise<PaginatedResponse<Sale>>
  findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Sale>>
  updateStatus(id: string, status: Sale['status']): Promise<Sale>
  updatePaymentStatus(id: string, paymentStatus: Sale['paymentStatus']): Promise<Sale>
  findByDateRange(startDate: Date, endDate: Date, pagination: PaginationParams): Promise<PaginatedResponse<Sale>>
  getSalesSummary(startDate: Date, endDate: Date): Promise<{
    totalSales: number
    totalRevenue: number
    totalItems: number
  }>
}