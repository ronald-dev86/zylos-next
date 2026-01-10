# Zylos ERP/POS Multi-tenant

## 🏗️ Monorepo Architecture

Zylos es un sistema ERP/POS multi-tenant implementado como monorepo para separar la gestión de tenants del negocio principal.

### 📁 Estructura

```
zylos/
├── apps/
│   ├── platform/     # platform.zylos.com (landing + auth + tenant management)
│   └── app/         # *.zylos.com (ERP core)
├── packages/
│   ├── shared-types/    # Tipos TypeScript compartidos
│   ├── ui-components/   # Componentes UI compartidos
│   └── utils/           # Utilidades compartidas
├── tools/
└── docs/
```

### 🚀 Technology Stack

- **Framework**: Next.js 16+ (App Router), TypeScript (Strict Mode)
- **Database**: Supabase (PostgreSQL) con Row Level Security
- **Validation**: Zod schemas para todos los contratos de datos
- **UI**: Tailwind CSS + Shadcn/UI
- **Monorepo**: Turborepo + npm workspaces

### 🔐 Key Architecture Principles

- **Multi-tenancy**: Aislamiento vía subdominios (tenant.zylos.com)
- **Security**: Row Level Security (RLS) obligatorio en PostgreSQL
- **Clean Architecture**: Separación clara entre dominio, aplicación e infraestructura
- **Zero Hardcoding**: Todo contexto de tenant dinámico

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
