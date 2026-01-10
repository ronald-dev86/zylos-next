import { BaseService } from './BaseService'
import { Database } from '@/shared/types/common'
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
  totalAmount: number
  status: 'pending' | 'completed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'partial'
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

export class SupabaseSaleRepository extends BaseService implements ISaleRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  async create(sale: CreateSaleData): Promise<Sale> {
    // Use the existing RPC function for transactional sale creation
    const result = await this.rpc<{
      id: string
      created_at: string
      items: Array<{
        product_id: string
        product_name: string
        quantity: number
        unit_price: number
        total_price: number
      }>
      subtotal: number
      tax: number
      total_amount: number
    }>('create_sale_transaction', {
      p_customer_id: sale.customerId,
      p_items: JSON.stringify(sale.items.map(item => ({
        product_id: item.productId,
        quantity: item.quantity,
        unit_price: item.unitPrice
      }))),
      p_tax: sale.tax || 0
    })

    // Get customer name
    const { data: customer } = await this.withTenantFilter()
      .from('customers')
      .select('name')
      .eq('id', sale.customerId)
      .single()

    return {
      id: result.id,
      tenantId: this.tenantId!,
      customerId: sale.customerId,
      customerName: customer?.name,
      items: result.items.map(item => ({
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price
      })),
      subtotal: result.subtotal,
      tax: result.tax,
      totalAmount: result.total_amount,
      status: 'completed',
      paymentStatus: 'pending',
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.created_at)
    }
  }

  async findById(id: string): Promise<Sale | null> {
    const { data, error } = await this.withTenantFilter()
      .from('sales')
      .select(`
        *,
        customer:customers(name),
        sale_items!inner(
          product_id,
          quantity,
          unit_price,
          products(name)
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw new Error(`Failed to find sale: ${error.message}`)
    if (!data) return null

    return this.mapToSale(data)
  }

  async findByCustomerId(customerId: string, pagination: PaginationParams): Promise<PaginatedResponse<Sale>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('sales')
      .select(`
        *,
        customer:customers(name),
        sale_items!inner(
          product_id,
          quantity,
          unit_price,
          products(name)
        )
      `, { count: 'exact' })
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find sales by customer: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToSale),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Sale>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('sales')
      .select(`
        *,
        customer:customers(name),
        sale_items!inner(
          product_id,
          quantity,
          unit_price,
          products(name)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find sales by tenant: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToSale),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async updateStatus(id: string, status: Sale['status']): Promise<Sale> {
    const { data, error } = await this.withTenantFilter()
      .from('sales')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        customer:customers(name),
        sale_items!inner(
          product_id,
          quantity,
          unit_price,
          products(name)
        )
      `)
      .single()

    if (error) throw new Error(`Failed to update sale status: ${error.message}`)
    if (!data) throw new Error('No data returned from sale status update')

    return this.mapToSale(data)
  }

  async updatePaymentStatus(id: string, paymentStatus: Sale['paymentStatus']): Promise<Sale> {
    const { data, error } = await this.withTenantFilter()
      .from('sales')
      .update({
        payment_status: paymentStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        customer:customers(name),
        sale_items!inner(
          product_id,
          quantity,
          unit_price,
          products(name)
        )
      `)
      .single()

    if (error) throw new Error(`Failed to update payment status: ${error.message}`)
    if (!data) throw new Error('No data returned from payment status update')

    return this.mapToSale(data)
  }

  async findByDateRange(startDate: Date, endDate: Date, pagination: PaginationParams): Promise<PaginatedResponse<Sale>> {
    const offset = (pagination.page - 1) * pagination.limit
    
    const { data, error, count } = await this.withTenantFilter()
      .from('sales')
      .select(`
        *,
        customer:customers(name),
        sale_items!inner(
          product_id,
          quantity,
          unit_price,
          products(name)
        )
      `, { count: 'exact' })
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .range(offset, offset + pagination.limit - 1)

    if (error) throw new Error(`Failed to find sales by date range: ${error.message}`)
    if (!data) return { data: [], pagination: { page: pagination.page, limit: pagination.limit, total: 0, totalPages: 0 } }

    const total = count || 0
    const totalPages = Math.ceil(total / pagination.limit)

    return {
      data: data.map(this.mapToSale),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages
      }
    }
  }

  async getSalesSummary(startDate: Date, endDate: Date): Promise<{
    totalSales: number
    totalRevenue: number
    totalItems: number
  }> {
    const result = await this.rpc<{
      total_sales: number
      total_revenue: number
      total_items: number
    }>('get_sales_summary', {
      p_start_date: startDate.toISOString(),
      p_end_date: endDate.toISOString()
    })

    return {
      totalSales: result.total_sales,
      totalRevenue: result.total_revenue,
      totalItems: result.total_items
    }
  }

  private mapToSale(data: any): Sale {
    return {
      id: data.id,
      tenantId: this.tenantId!,
      customerId: data.customer_id,
      customerName: data.customer?.name,
      items: data.sale_items.map((item: any) => ({
        productId: item.product_id,
        productName: item.products?.name || 'Unknown Product',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.quantity * item.unit_price
      })),
      subtotal: data.subtotal,
      tax: data.tax,
      totalAmount: data.total_amount,
      status: data.status,
      paymentStatus: data.payment_status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }
}