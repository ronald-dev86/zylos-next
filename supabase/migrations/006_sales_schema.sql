-- Sales Table Schema
-- Additional tables needed for SupabaseSaleRepository functionality

-- Sales table (main sales records)
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sale items table (individual line items)
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(10,3) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_status ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales(payment_status);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- Enable Row Level Security
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales table
CREATE POLICY "Users can view sales from their tenant" ON sales
    FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id'::UUID);

CREATE POLICY "Users can insert sales for their tenant" ON sales
    FOR INSERT WITH CHECK (tenant_id = auth.jwt() ->> 'tenant_id'::UUID);

CREATE POLICY "Users can update sales from their tenant" ON sales
    FOR UPDATE USING (tenant_id = auth.jwt() ->> 'tenant_id'::UUID);

-- RLS Policies for sale_items table
CREATE POLICY "Users can view sale items from their tenant" ON sale_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sales 
            WHERE sales.id = sale_items.sale_id 
            AND sales.tenant_id = auth.jwt() ->> 'tenant_id'::UUID
        )
    );

CREATE POLICY "Users can insert sale items for their tenant" ON sale_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sales 
            WHERE sales.id = sale_items.sale_id 
            AND sales.tenant_id = auth.jwt() ->> 'tenant_id'::UUID
        )
    );

-- Grant permissions
GRANT ALL ON sales TO authenticated;
GRANT ALL ON sales TO service_role;
GRANT ALL ON sale_items TO authenticated;
GRANT ALL ON sale_items TO service_role;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sales_updated_at 
    BEFORE UPDATE ON sales 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();