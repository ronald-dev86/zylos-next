import { BaseRepository } from './BaseRepository'
import { Database } from '@/shared/types/database'
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

export class SupabaseSaleRepository extends BaseRepository<Sale> implements ISaleRepository {
  constructor(tenantId: string) {
    super(tenantId)
  }

  protected mapToEntity(data: any): Sale {
    return this.mapToSale(data)
  }

  protected getTableName(): string {
    return 'sales'
  }

  private mapToSale(data: any): Sale {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      customerId: data.customer_id,
      customerName: data.customer?.name,
      items: data.sale_items?.map((item: any) => ({
        productId: item.product_id,
        productName: item.products?.name || 'Unknown',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.quantity * item.unit_price
      })) || [],
      subtotal: data.subtotal,
      tax: data.tax,
      total: data.total,
      status: data.status,
      paymentStatus: data.payment_status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  async create(sale: CreateSaleData): Promise<Sale> {
    const total = sale.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    const subtotal = total
    const finalTotal = subtotal + (sale.tax || 0)

    const { data, error } = await this.withTenantFilter()
      .from('sales')
      .insert([{
        customer_id: sale.customerId,
        subtotal,
        tax: sale.tax,
        total: finalTotal,
        status: 'pending',
        payment_status: 'pending'
      }])
      .select()
      .single()

    if (error) throw new Error(`Failed to create sale: ${error.message}`)
    if (!data) throw new Error('No data returned from sale creation')

    // Create sale items
    const itemsToInsert = sale.items.map(item => ({
      sale_id: data.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice
    }))

    const { error: itemsError } = await this.supabase
      .from('sale_items')
      .insert(itemsToInsert)

    if (itemsError) throw new Error(`Failed to create sale items: ${itemsError.message}`)

    // Return complete sale with items
    const { data: completeSale, error: fetchError } = await this.withTenantFilter()
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
      .eq('id', data.id)
      .single()

    if (fetchError) throw new Error(`Failed to fetch complete sale: ${fetchError.message}`)
    return this.mapToSale(completeSale)
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

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find sale: ${error.message}`)
    }

    return this.mapToSale(data)
  }

  async findByCustomerId(customerId: string, pagination: PaginationParams): Promise<PaginatedResponse<Sale>> {
    const query = this.withTenantFilter()
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
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async findByTenantId(pagination: PaginationParams): Promise<PaginatedResponse<Sale>> {
    const query = this.withTenantFilter()
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
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
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
    const query = this.withTenantFilter()
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
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })

    return await this.paginate(query, pagination)
  }

  async getSalesSummary(startDate: Date, endDate: Date): Promise<{
    totalSales: number
    totalRevenue: number
    totalItems: number
  }> {
    // For now, return a basic summary - can be enhanced with RPC function later
    const { data, error } = await this.withTenantFilter()
      .from('sales')
      .select('total, subtotal')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .eq('status', 'completed')

    if (error) throw new Error(`Failed to get sales summary: ${error.message}`)

    const totalSales = data?.length || 0
    const totalRevenue = data?.reduce((sum, sale) => sum + sale.total, 0) || 0
    
    // Get total items count
    const { data: itemsData, error: itemsError } = await this.supabase
      .from('sale_items')
      .select('quantity')
      .in('sale_id', data?.map((s: any) => s.id) || [])

    if (itemsError) throw new Error(`Failed to get items count: ${itemsError.message}`)
    
    const totalItems = itemsData?.reduce((sum, item) => sum + item.quantity, 0) || 0

    return {
      totalSales,
      totalRevenue,
      totalItems
    }
  }
}