# 🚀 QUICK START GUIDE - ZYLOS ERP

## ✅ **PREREQUISITES**

### **1. Environment Setup**
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your local Supabase values
nano .env.local
```

### **2. Install Dependencies**
```bash
npm install
# All required packages are now included
```

### **3. Start Supabase Local**
```bash
# Start local Supabase instance
npx supabase start

# This will start:
# - Database: http://localhost:54322
# - API: http://localhost:54321  
# - Studio: http://localhost:54323
# - Inbucket (email): http://localhost:54324
```

### **4. Apply Database Migrations**
```bash
# Apply all hybrid migrations
npx supabase db push

# Expected output:
# ✅ migrations/001_initial_schema.sql applied
# ✅ migrations/002_sales_schema.sql applied  
# ✅ migrations/003_business_functions.sql applied
# ✅ migrations/004_enhanced_rls_policies.sql applied
# ✅ migrations/005_user_management.sql applied
# ✅ migrations/006_repository_rpc.sql applied
# ✅ migrations/007_seed_data.sql applied
# ✅ migrations/008_missing_functions.sql applied
```

### **5. Start Development Server**
```bash
npm run dev

# Available at: http://localhost:3000
```

## 🧪 **TESTING THE SETUP**

### **1. Test Tenant Resolution**
```bash
# Access different tenants via subdomain
# http://demo.localhost:3000 (should work)
# http://admin.localhost:3000 (should work)
# http://nonexistent.localhost:3000 (should show 404)
```

### **2. Test API Endpoints**

#### **Auth Context**
```bash
curl http://localhost:3000/api/auth/context \
  -H "x-tenant-id: 123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### **Create Product**
```bash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Product",
    "sku": "TEST-001",
    "price": 29.99,
    "initial_stock": 100
  }'
```

#### **Create Sale**
```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: 123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "customer_id": "123e4567-e89b-12d3-a456-426614174001",
    "items": [
      {
        "product_id": "123e4567-e89b-12d3-a456-426614174002",
        "quantity": 2,
        "unit_price": 29.99
      }
    ],
    "tax": 0
  }'
```

## 🔧 **ARCHITECTURE VALIDATION**

### **1. Test RLS Policies**
```sql
-- Connect to database
psql 'postgresql://postgres:postgres@localhost:54322/postgres'

-- Test tenant isolation
SELECT COUNT(*) FROM products WHERE tenant_id = 'different_tenant_id';
-- Should return 0 for regular users

-- Test admin bypass
-- Login as admin and check cross-tenant access
```

### **2. Test RPC Functions**
```sql
-- Test product creation
SELECT create_product_rpc(
  'Test Product', 
  'Description', 
  'TEST-002', 
  19.99, 
  50
);

-- Test tenant extraction
SELECT get_current_tenant_id();
```

### **3. Test User Management**
```sql
-- Test user trigger
INSERT INTO auth.users (id, email) VALUES 
('test-user-id', 'test@example.com');

-- Should automatically create user record in public.users
SELECT * FROM users WHERE email = 'test@example.com';
```

## 🚨 **TROUBLESHOOTING**

### **Middleware Issues**
- **Problem**: 404 on valid subdomain
- **Solution**: Check `NEXT_PUBLIC_SUPABASE_URL` and tenant data

### **API Issues**  
- **Problem**: 403 Forbidden
- **Solution**: Verify JWT includes `tenant_id` claim

### **Database Issues**
- **Problem**: Migration fails
- **Solution**: Reset with `npx supabase db reset`

### **Auth Issues**
- **Problem**: User creation fails
- **Solution**: Check trigger `handle_new_user()` in migration 005

## 📊 **EXPECTED FEATURES**

✅ **Multi-tenant isolation** via subdomain  
✅ **Row Level Security** with dual validation  
✅ **Atomic transactions** via RPC functions  
✅ **Type-safe API** with UUID consistency  
✅ **Auto user management** via triggers  
✅ **Real-time stock** tracking  
✅ **Financial ledger** integrity  

## 🎯 **NEXT STEPS**

1. **Test complete integration** using examples above
2. **Update frontend** to use new API routes
3. **Deploy to production** when local testing passes
4. **Monitor performance** and optimize as needed

**¡Your Zylos ERP is ready for development!** 🚀