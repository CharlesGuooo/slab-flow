# SlabFlow - Multi-tenant SaaS Platform

**Version:** 3.0 (Multi-tenant SaaS Architecture)
**Last Updated:** 2026-02-23

---

## Overview

SlabFlow is a multi-tenant SaaS platform designed for the stone fabrication industry. It enables multiple stone fabricators (tenants) to have their own branded websites while sharing a single codebase and database infrastructure.

### Industry Background

The stone fabrication industry involves two key roles:

1. **Stone Suppliers** - Import stone slabs (typically 3.2m × 1.6m × 2cm) from quarries
2. **Fabricators** (Our customers) - Purchase slabs and provide cutting, polishing, and installation services

### Business Flow

1. Customer contacts fabricator (often via designer)
2. Fabricator showcases stone options
3. Customer selects stone
4. Fabricator measures site and provides quote (stone cost + fabrication cost)
5. Fabricator completes installation

---

## Key Features

### Multi-tenant Architecture
- Single deployment serves all tenants
- Domain-based tenant identification
- Complete data isolation between tenants
- Per-tenant branding and theming

### Customer-Facing Features
- **Stone Catalog** - Browse available stones with filtering
- **AI Chatbot** - Get recommendations and visualizations
- **Quote Requests** - Submit and track quote requests
- **3D Scene Reconstruction** - View AI-generated 3D models of their space

### Tenant Admin Features
- **Dashboard** - Overview of orders and customers
- **Inventory Management** - Manage stone catalog with multi-language support
- **Order Management** - Review and respond to quote requests
- **Customer Management** - View and manage customer accounts
- **Calculator Settings** - Configure fabrication pricing

### Platform Admin Features
- **Tenant Management** - Create and configure new tenants
- **Feature Flags** - Enable/disable features per tenant
- **Theme Configuration** - Set branding for each tenant
- **Budget Management** - Configure AI usage limits

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js (App Router) | React framework with SSR/SSG |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Language | TypeScript | Type-safe development |
| Database | Vercel Postgres (Neon) | Serverless PostgreSQL |
| ORM | Drizzle ORM | Type-safe SQL queries |
| Storage | Cloudflare R2 | Object storage for images/files |
| Email | Resend | Transactional emails |
| AI Chat | OpenAI GPT-4 | Conversational AI |
| AI Imaging | Nano Banana Pro | Stone visualization rendering |
| 3D Reconstruction | World Labs API | 2D to 3D scene generation |
| 3D Viewer | SparkJS | WebGL-based SPZ viewer |
| Deployment | Vercel | Serverless hosting |

---

## Project Structure

```
/slabflow
├── /app
│   ├── /(admin)               # Tenant admin routes
│   │   ├── /admin/login
│   │   ├── /admin/dashboard
│   │   ├── /admin/inventory
│   │   ├── /admin/orders
│   │   ├── /admin/customers
│   │   └── /admin/calculator-settings
│   ├── /(client)              # Customer-facing routes
│   │   ├── /register
│   │   ├── /login
│   │   ├── /browse
│   │   ├── /account
│   │   └── /chat
│   ├── /platform-admin        # Platform admin routes
│   │   ├── /login
│   │   └── /tenants
│   ├── /api                   # API routes
│   │   ├── /auth
│   │   ├── /chat
│   │   ├── /orders
│   │   └── /reconstruction
│   ├── layout.tsx
│   └── page.tsx
├── /components                # Shared components
│   ├── /ui
│   ├── /chat
│   ├── /inventory
│   └── /orders
├── /lib                       # Core services
│   ├── db.ts                  # Drizzle client
│   ├── r2.ts                  # R2 storage client
│   └── utils.ts
├── /drizzle                   # Database
│   └── schema.ts              # Multi-tenant schema
├── middleware.ts              # Tenant identification
├── feature_list.json          # Test specifications
├── init.sh                    # Setup script
└── README.md
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL database (Neon recommended)
- Cloudflare R2 bucket
- API keys (OpenAI, Resend, World Labs)

### Setup

1. **Clone and initialize**
   ```bash
   git clone <repository-url>
   cd slabflow
   chmod +x init.sh
   ./init.sh
   ```

2. **Configure environment**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Set up database**
   ```bash
   npx drizzle-kit push
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Main app: http://localhost:3000
   - Platform admin: http://localhost:3000/platform-admin

### Local Multi-tenant Testing

Add entries to `/etc/hosts`:
```
127.0.0.1 tenant1.localhost
127.0.0.1 tenant2.localhost
```

Access via http://tenant1.localhost:3000

---

## Environment Variables

```env
# Database
DATABASE_URL="postgres://..."

# Cloudflare R2
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET_NAME="slabflow-main"
R2_PUBLIC_URL="https://pub-....r2.dev"

# API Keys
RESEND_API_KEY="re_..."
OPENAI_API_KEY="sk-..."
WORLD_LABS_API_KEY="sk-..."

# Security
AUTH_SECRET="random-32-character-string"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Database Schema

### Core Tables

- **tenants** - Merchant accounts with branding and feature flags
- **users** - Customer accounts (scoped to tenant)
- **admins** - Admin accounts (super_admin or tenant_admin)
- **inventory_stones** - Stone inventory (scoped to tenant)
- **client_orders** - Quote requests (scoped to tenant)
- **order_photos** - Photos attached to orders
- **calculation_items** - Fabrication pricing items

All business tables include `tenantId` for data isolation.

---

## Development Milestones

1. **Milestone 1:** Foundation & Core Services ✅
2. **Milestone 2:** Admin Panel
3. **Milestone 3:** Client Authentication & Showcase
4. **Milestone 4:** AI Chatbot
5. **Milestone 5:** Business Logic & Quoting
6. **Milestone 6:** 3D Scene Reconstruction

---

## Testing

Test specifications are defined in `feature_list.json`. Each feature includes:
- Category (functional/style)
- Description
- Step-by-step test procedure
- Pass/fail status

Run tests manually following the procedures, marking features as passing when verified.

---

## Security Principles

1. **Tenant Isolation** - All queries include `WHERE tenantId = ?`
2. **R2 Path Isolation** - Files stored at `/{tenantId}/...`
3. **Feature Flags** - Check before enabling UI/API features
4. **Cost Control** - Track user credits and tenant budgets
5. **Session Validation** - Never trust client-provided tenant data

---

## License

Proprietary - All rights reserved

---

## Support

For technical support, contact the development team.
