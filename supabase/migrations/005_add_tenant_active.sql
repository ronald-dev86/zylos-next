-- Add active field to tenants table for better middleware logic
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_tenants_active_subdomain ON tenants(active, subdomain);