-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Create extension for gen_random_uuid() alternative
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tenant roles enum
CREATE TYPE tenant_role AS ENUM ('super_admin', 'admin', 'vendedor', 'contador');

-- Create entity type enum
CREATE TYPE entity_type AS ENUM ('customer', 'supplier');

-- Create movement type enum
CREATE TYPE movement_type AS ENUM ('in', 'out', 'adjustment');

-- Create ledger type enum
CREATE TYPE ledger_type AS ENUM ('credit', 'debit');

-- Tenants table - Core multi-tenant structure
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    subdomain VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with RLS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    role tenant_role NOT NULL DEFAULT 'vendedor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    sku VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, sku)
);

-- Inventory movements - Immutable ledger for stock tracking
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    type movement_type NOT NULL,
    quantity DECIMAL(10,3) NOT NULL,
    reason TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ledger entries - Immutable financial ledger
CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type entity_type NOT NULL,
    entity_id UUID NOT NULL,
    type ledger_type NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can view users from same tenant" ON users
    FOR SELECT USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Users can view products from their tenant" ON products
    FOR SELECT USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

CREATE POLICY "Users can insert products for their tenant" ON products
    FOR INSERT WITH CHECK (auth.jwt() ->> 'tenant_id' = tenant_id::text);

CREATE POLICY "Users can update products from their tenant" ON products
    FOR UPDATE USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

CREATE POLICY "Users can delete products from their tenant" ON products
    FOR DELETE USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- Inventory movements policies
CREATE POLICY "Users can view movements from their tenant" ON inventory_movements
    FOR SELECT USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

CREATE POLICY "Users can insert movements for their tenant" ON inventory_movements
    FOR INSERT WITH CHECK (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- Customers policies
CREATE POLICY "Users can view customers from their tenant" ON customers
    FOR SELECT USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

CREATE POLICY "Users can manage customers from their tenant" ON customers
    FOR ALL USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- Suppliers policies
CREATE POLICY "Users can view suppliers from their tenant" ON suppliers
    FOR SELECT USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

CREATE POLICY "Users can manage suppliers from their tenant" ON suppliers
    FOR ALL USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- Ledger entries policies
CREATE POLICY "Users can view ledger entries from their tenant" ON ledger_entries
    FOR SELECT USING (auth.jwt() ->> 'tenant_id' = tenant_id::text);

CREATE POLICY "Users can insert ledger entries for their tenant" ON ledger_entries
    FOR INSERT WITH CHECK (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- Indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_inventory_movements_tenant_id ON inventory_movements(tenant_id);
CREATE INDEX idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX idx_ledger_entries_tenant_id ON ledger_entries(tenant_id);
CREATE INDEX idx_ledger_entries_entity ON ledger_entries(entity_type, entity_id);

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();