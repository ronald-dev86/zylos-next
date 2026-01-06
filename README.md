# Zylos ERP/POS Multi-tenant

## Architecture Overview

Zylos is a multi-tenant ERP/POS system built with Next.js 15 and Supabase, designed for massive scalability and efficient operational costs.

### Key Architecture Principles

- **Multi-tenancy**: Logical isolation via subdomains (tenant.zylos.com)
- **Security**: Mandatory Row Level Security (RLS) in PostgreSQL
- **Data Integrity**: Immutable ledger model for financial tracking
- **Clean Architecture**: Clear separation between domain, application, and infrastructure layers
- **Type Safety**: TypeScript strict mode with comprehensive Zod validation

### Tech Stack

- **Frontend**: Next.js 15+ (App Router), TypeScript (Strict Mode)
- **Backend/DB**: Supabase (PostgreSQL), Edge Functions
- **Validation**: Zod schemas for all data contracts
- **UI**: Tailwind CSS + Shadcn/UI

## Project Structure

```
/zylos-erp
├── /supabase            # Migrations and Seed (DB source of truth)
├── /src
│   ├── /app             # Dynamic routes by subdomain
│   ├── /core            # Business logic (Zylos use cases)
│   ├── /infrastructure  # API clients, Supabase, external services
│   └── /shared          # Common UI components and utilities
└── README.md
```

## Getting Started

1. **Clone and install dependencies**
   ```bash
   git clone <repository>
   cd zylos
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Configure your Supabase credentials
   ```

3. **Database setup**
   ```bash
   # Apply migrations to your Supabase project
   supabase db push
   # Seed initial data
   supabase db seed
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Database Design

### Core Tables

- **tenants**: Multi-tenant isolation
- **users**: User management with RBAC
- **products**: Product catalog
- **inventory_movements**: Immutable stock tracking
- **customers/suppliers**: Contact management
- **ledger_entries**: Financial ledger (immutable)

### Security

- All tables use Row Level Security (RLS)
- JWT-based tenant isolation
- Role-based access control: super_admin, admin, vendedor, contador

## Development Workflow

### Core Principles

1. **Zero Hardcoding**: All tenant context must be dynamic
2. **Atomic Operations**: Critical processes use database functions for transactionality
3. **Clean Architecture**: Maintain clear layer separation

### Adding Features

1. Define domain entities in `/src/core/domain/`
2. Create use cases in `/src/core/use-cases/`
3. Implement infrastructure adapters in `/src/infrastructure/`
4. Build UI components in `/src/shared/components/`

## Business Logic Functions

The system includes PostgreSQL functions for critical operations:

- `calculate_stock()`: Real-time inventory calculation
- `record_inventory_movement()`: Transactional stock management
- `create_sale_transaction()`: Complete sales processing
- `get_customer_balance()` / `get_supplier_balance()`: Financial balances
- `record_payment()`: Payment processing

## Testing

```bash
# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Deployment

This MVP is designed for Vercel + Supabase deployment:

1. Connect your Vercel project to the repository
2. Configure environment variables in Vercel
3. Deploy with automatic CI/CD

## License

[Your License Here]
