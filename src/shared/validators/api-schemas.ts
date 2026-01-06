export const CreateUserSchema = {
  body: {
    email: { type: 'string', format: 'email', required: true },
    password: { type: 'string', minLength: 8, required: true },
    tenant_id: { type: 'string', format: 'uuid', required: true },
    role: { type: 'string', enum: ['super_admin', 'admin', 'vendedor', 'contador'], required: true }
  }
}

export const CreateProductSchema = {
  body: {
    name: { type: 'string', minLength: 1, maxLength: 200, required: true },
    description: { type: 'string', optional: true },
    sku: { type: 'string', minLength: 1, maxLength: 50, required: true },
    price: { type: 'number', minimum: 0, required: true }
  }
}

export const CreateInventoryMovementSchema = {
  body: {
    product_id: { type: 'string', format: 'uuid', required: true },
    type: { type: 'string', enum: ['in', 'out', 'adjustment'], required: true },
    quantity: { type: 'number', minimum: 0, required: true },
    reason: { type: 'string', optional: true },
    reference_id: { type: 'string', format: 'uuid', optional: true }
  }
}

export const CreateCustomerSchema = {
  body: {
    name: { type: 'string', minLength: 1, maxLength: 100, required: true },
    email: { type: 'string', format: 'email', optional: true },
    phone: { type: 'string', optional: true },
    address: { type: 'string', optional: true }
  }
}

export const CreateSupplierSchema = {
  body: {
    name: { type: 'string', minLength: 1, maxLength: 100, required: true },
    email: { type: 'string', format: 'email', optional: true },
    phone: { type: 'string', optional: true },
    address: { type: 'string', optional: true }
  }
}

export const CreateLedgerEntrySchema = {
  body: {
    entity_type: { type: 'string', enum: ['customer', 'supplier'], required: true },
    entity_id: { type: 'string', format: 'uuid', required: true },
    type: { type: 'string', enum: ['credit', 'debit'], required: true },
    amount: { type: 'number', minimum: 0, required: true },
    description: { type: 'string', optional: true },
    reference_id: { type: 'string', format: 'uuid', optional: true }
  }
}