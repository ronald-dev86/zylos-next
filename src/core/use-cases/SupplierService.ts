import { Supplier } from '../entities/Supplier'
import { ISupplierRepository } from '../services/ISupplierRepository'
import { ILedgerEntryRepository } from '../services/ILedgerEntryRepository'
import { PaginationParams, PaginatedResponse } from '@/shared/types/common'

export class SupplierService {
  constructor(
    private supplierRepository: ISupplierRepository,
    private ledgerRepository: ILedgerEntryRepository
  ) {}

  async createSupplier(
    tenantId: string,
    name: string,
    email?: string,
    phone?: string,
    address?: string
  ): Promise<Supplier> {
    // Check if email already exists for this tenant
    if (email) {
      const existingSupplier = await this.supplierRepository.findByEmail(email, tenantId)
      if (existingSupplier) {
        throw new Error('Supplier email already exists')
      }
    }

    const supplierData = Supplier.create(tenantId, name, email, phone, address)
    return await this.supplierRepository.create(supplierData)
  }

  async getSupplierById(id: string, tenantId: string): Promise<Supplier | null> {
    return await this.supplierRepository.findById(id, tenantId)
  }

  async getSupplierByEmail(email: string, tenantId: string): Promise<Supplier | null> {
    return await this.supplierRepository.findByEmail(email, tenantId)
  }

  async getSuppliersByTenant(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Supplier>> {
    return await this.supplierRepository.findByTenantId(tenantId, pagination)
  }

  async searchSuppliers(
    name: string,
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Supplier>> {
    return await this.supplierRepository.searchByName(name, tenantId, pagination)
  }

  async updateSupplier(
    id: string,
    tenantId: string,
    data: {
      name?: string
      email?: string
      phone?: string
      address?: string
    }
  ): Promise<Supplier> {
    // If updating email, check if it already exists
    if (data.email) {
      const existingSupplier = await this.supplierRepository.findByEmail(data.email, tenantId)
      if (existingSupplier && existingSupplier.id !== id) {
        throw new Error('Supplier email already exists')
      }
    }

    return await this.supplierRepository.update(id, tenantId, data)
  }

  async deleteSupplier(id: string, tenantId: string): Promise<void> {
    // Check if supplier has ledger entries (outstanding balance)
    const balance = await this.getSupplierBalance(id, tenantId)
    if (balance !== 0) {
      throw new Error('Cannot delete supplier with outstanding balance')
    }

    await this.supplierRepository.delete(id, tenantId)
  }

  async getSupplierBalance(supplierId: string, tenantId: string): Promise<number> {
    return await this.ledgerRepository.calculateEntityBalance(
      'supplier',
      supplierId,
      tenantId
    )
  }

  async getSuppliersWithBalance(
    tenantId: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Supplier & { balance: number }>> {
    const suppliers = await this.getSuppliersByTenant(tenantId, pagination)
    
    // Add balance information to each supplier
    const suppliersWithBalance = await Promise.all(
      suppliers.data.map(async (supplier) => {
        const balance = await this.getSupplierBalance(supplier.id, supplier.tenantId)
        return Object.assign(supplier, { balance })
      })
    )

    return {
      data: suppliersWithBalance,
      pagination: suppliers.pagination
    }
  }

  async getSupplierLedgerEntries(
    supplierId: string,
    tenantId: string,
    pagination: PaginationParams
  ) {
    return await this.ledgerRepository.findByEntity(
      'supplier',
      supplierId,
      tenantId,
      pagination
    )
  }
}