# Zylos Platform

Multi-tenant ERP/POS platform core system.

## Purpose

Handles:
- Tenant-specific ERP operations
- Business logic (inventory, sales, financial)
- Multi-tenant user management
- Real-time operations

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Database**: Supabase (PostgreSQL) with RLS
- **Auth**: Supabase Auth with tenant isolation
- **UI**: Tailwind CSS + Shadcn/UI
- **Validation**: Zod
- **Types**: @zylos/shared-types (NPM package)

## Architecture

- **Multi-tenancy**: Subdomain-based isolation (*.zylos.com)
- **Security**: Row Level Security (RLS) enforced
- **Clean Architecture**: Domain → Application → Infrastructure
- **Atomic Operations**: Database functions for critical processes

## Getting Started

```bash
npm install
npm run dev
```

## Environment

Configure:
- Supabase URL and keys
- Tenant domain routing
- Database connection

## Deployment

Deployed to Vercel with wildcard subdomains: `*.zylos.com`