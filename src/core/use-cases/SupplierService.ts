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
    name: string,
    email?: string,
    phone?: string,
    address?: string
  ): Promise<Supplier> {
    // Check if email already exists
    if (email) {
      const existingSupplier = await this.supplierRepository.findByEmail(email)
      if (existingSupplier) {
        throw new Error('Supplier email already exists')
      }
    }

    const supplierData = { name, email, phone, address }
    return await this.supplierRepository.create(supplierData)
  }

  async getSupplierById(id: string): Promise<Supplier | null> {
    return await this.supplierRepository.findById(id)
  }

  async getSupplierByEmail(email: string): Promise<Supplier | null> {
    return await this.supplierRepository.findByEmail(email)
  }

  async getSuppliersByTenant(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Supplier>> {
    return await this.supplierRepository.findByTenantId(pagination)
  }

  async searchSuppliers(
    name: string,
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Supplier>> {
    return await this.supplierRepository.searchByName(name, pagination)
  }

  async updateSupplier(
    id: string,
    data: {
      name?: string
      email?: string
      phone?: string
      address?: string
    }
  ): Promise<Supplier> {
    // If updating email, check if it already exists
    if (data.email) {
      const existingSupplier = await this.supplierRepository.findByEmail(data.email)
      if (existingSupplier && existingSupplier.id !== id) {
        throw new Error('Supplier email already exists')
      }
    }

    return await this.supplierRepository.update(id, data)
  }

  async deleteSupplier(id: string): Promise<void> {
    // Check if supplier has ledger entries (outstanding balance)
    const balance = await this.getSupplierBalance(id)
    if (balance !== 0) {
      throw new Error('Cannot delete supplier with outstanding balance')
    }

    await this.supplierRepository.delete(id)
  }

  async getSupplierBalance(supplierId: string): Promise<number> {
    return await this.ledgerRepository.calculateEntityBalance('supplier', supplierId)
  }

  async getSuppliersWithBalance(
    pagination: PaginationParams
  ): Promise<PaginatedResponse<Supplier & { balance: number }>> {
    const suppliers = await this.getSuppliersByTenant(pagination)
    
    // Add balance information to each supplier
    const suppliersWithBalance = await Promise.all(
      suppliers.data.map(async (supplier) => {
        const balance = await this.getSupplierBalance(supplier.id)
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
    pagination: PaginationParams
  ) {
    return await this.ledgerRepository.findByEntity('supplier', supplierId, pagination)
  }
}