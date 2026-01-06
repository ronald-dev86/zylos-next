'use client'

import { useState, useEffect } from 'react'
import { SupplierService } from '@/core/use-cases/SupplierService'
import { SupplierRepository } from '@/infrastructure/database/SupplierRepository'
import { LedgerEntryRepository } from '@/infrastructure/database/LedgerEntryRepository'
import { ApiResponse, PaginationParams, Supplier } from '@/shared/types/schemas'
import { Button } from '@/shared/components/Button'
import { Input } from '@/shared/components/Input'
import { Card } from '@/shared/components/Card'

interface SupplierWithBalance extends Supplier {
  balance: number
  balance_to_pay: number
  account_status: string
  last_payment_date: string | null
  credit_limit: number
}

const supplierService = new SupplierService(
  new SupplierRepository(),
  new LedgerEntryRepository()
)

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierWithBalance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showOnlyWithDebt, setShowOnlyWithDebt] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<SupplierWithBalance | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Cargar proveedores al montar
  useEffect(() => {
    loadSuppliers()
  }, [search, showOnlyWithDebt])

  const loadSuppliers = async () => {
    try {
      setLoading(true)
      
      const query = {
        search: search.trim() || undefined,
        has_debt: showOnlyWithDebt || undefined,
        page: pagination.page,
        limit: pagination.limit
      }

      const response = await supplierService.getSuppliersWithBalance('current-tenant', query)
      
      if (response.success && response.data) {
        setSuppliers(response.data.items)
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }))
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSupplier = async (formData: any) => {
    try {
      const response = await supplierService.createSupplier('current-tenant', formData)
      
      if (response.success) {
        setShowCreateForm(false)
        loadSuppliers() // Reload list
        alert('Supplier created successfully!')
      } else {
        alert(`Error: ${response.message}`)
      }
    } catch (error) {
      console.error('Create supplier error:', error)
      alert('Failed to create supplier')
    }
  }

  const handleUpdateSupplier = async (formData: any) => {
    if (!editingSupplier) return

    try {
      const response = await supplierService.updateSupplier(
        editingSupplier.id,
        'current-tenant',
        formData
      )
      
      if (response.success) {
        setEditingSupplier(null)
        loadSuppliers() // Reload list
        alert('Supplier updated successfully!')
      } else {
        alert(`Error: ${response.message}`)
      }
    } catch (error) {
      console.error('Update supplier error:', error)
      alert('Failed to update supplier')
    }
  }

  const handleDeleteSupplier = async (supplierId: string, supplierName: string) => {
    if (!confirm(`Are you sure you want to delete "${supplierName}"?`)) return

    try {
      const response = await supplierService.deleteSupplier(supplierId, 'current-tenant')
      
      if (response.success) {
        loadSuppliers() // Reload list
        alert('Supplier deleted successfully!')
      } else {
        alert(`Error: ${response.message}`)
      }
    } catch (error) {
      console.error('Delete supplier error:', error)
      alert('Failed to delete supplier')
    }
  }

  const handlePayment = async (supplierId: string, supplierName: string) => {
    const amount = prompt(`Enter payment amount for ${supplierName}:`)
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return

    try {
      const response = await supplierService.processSupplierPayment(
        supplierId,
        'current-tenant',
        {
          amount: Number(amount),
          description: 'Manual payment',
          payment_method: 'cash'
        }
      )
      
      if (response.success) {
        loadSuppliers() // Reload list
        alert('Payment processed successfully!')
      } else {
        alert(`Error: ${response.message}`)
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Failed to process payment')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'al_dia': return 'text-green-600 bg-green-100'
      case 'pendiente_menor_30': return 'text-yellow-600 bg-yellow-100'
      case 'pendiente_31_60': return 'text-orange-600 bg-orange-100'
      case 'pendiente_61_90': return 'text-red-600 bg-red-100'
      case 'pendiente_mayor_90': return 'text-red-800 bg-red-200'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading suppliers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏭 Suppliers Management</h1>
          <p className="text-gray-600">Manage your suppliers with complete account tracking</p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Suppliers
              </label>
              <Input
                type="text"
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div className="flex gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOnlyWithDebt}
                  onChange={(e) => setShowOnlyWithDebt(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Show only with debt</span>
              </label>
              
              <Button onClick={() => setShowCreateForm(true)}>
                ➕ New Supplier
              </Button>
            </div>
          </div>
        </Card>

        {/* Pagination Info */}
        <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
          <span>Showing {suppliers.length} of {pagination.total} suppliers</span>
          <span>Page {pagination.page} of {pagination.totalPages}</span>
        </div>

        {/* Suppliers Grid */}
        {suppliers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {suppliers.map((supplier) => (
              <Card key={supplier.id} className="relative">
                {/* Account Status Badge */}
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(supplier.account_status)}`}>
                  {supplier.account_status.replace('_', ' ').toUpperCase()}
                </div>

                <div className="space-y-4">
                  {/* Supplier Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{supplier.name}</h3>
                    {supplier.email && (
                      <p className="text-sm text-gray-600">📧 {supplier.email}</p>
                    )}
                    {supplier.phone && (
                      <p className="text-sm text-gray-600">📱 {supplier.phone}</p>
                    )}
                    {supplier.address && (
                      <p className="text-sm text-gray-600">📍 {supplier.address}</p>
                    )}
                  </div>

                  {/* Financial Info */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Current Balance:</span>
                      <span className={`font-bold ${supplier.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(supplier.balance)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">To Pay:</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(supplier.balance_to_pay)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Credit Limit:</span>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(supplier.credit_limit)}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Last Payment:</span>
                      <span className="font-bold text-gray-600">
                        {supplier.last_payment_date 
                          ? new Date(supplier.last_payment_date).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingSupplier(supplier)}
                    >
                      ✏️ Edit
                    </Button>
                    
                    {supplier.balance_to_pay > 0 && (
                      <Button 
                        size="sm"
                        onClick={() => handlePayment(supplier.id, supplier.name)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        💳 Pay
                      </Button>
                    )}
                    
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                      className="text-red-600 hover:text-red-700 hover:border-red-600"
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <div className="text-gray-500 text-lg">📋 No suppliers found</div>
            <p className="text-gray-400 mt-2">
              {search ? 'Try adjusting your search criteria' : 'Create your first supplier to get started'}
            </p>
          </Card>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mb-6">
            <Button
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => {
                setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                loadSuppliers()
              }}
            >
              Previous
            </Button>
            
            <span className="text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => {
                setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                loadSuppliers()
              }}
            >
              Next
            </Button>
          </div>
        )}

        {/* Create/Edit Supplier Modal */}
        {(showCreateForm || editingSupplier) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-lg m-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingSupplier ? '✏️ Edit Supplier' : '➕ New Supplier'}
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setEditingSupplier(null)
                  }}
                >
                  ✕
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = Object.fromEntries(new FormData(e.currentTarget).entries())
                
                if (editingSupplier) {
                  handleUpdateSupplier(formData)
                } else {
                  handleCreateSupplier(formData)
                }
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <Input
                    name="name"
                    type="text"
                    required
                    defaultValue={editingSupplier?.name || ''}
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    name="email"
                    type="email"
                    defaultValue={editingSupplier?.email || ''}
                    placeholder="supplier@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    defaultValue={editingSupplier?.phone || ''}
                    placeholder="+1-234-567-8900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <Input
                    name="address"
                    defaultValue={editingSupplier?.address || ''}
                    placeholder="123 Business St, City, State"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setEditingSupplier(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingSupplier ? '💾 Update' : '➕ Create'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}