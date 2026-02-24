#!/bin/bash

# SlabFlow - Multi-tenant SaaS Platform for Stone Fabrication Industry
# Environment Setup Script
# Version: 3.0
# Date: 2026-02-23

set -e

echo "=========================================="
echo "  SlabFlow Environment Setup"
echo "  Multi-tenant SaaS Platform v3.0"
echo "=========================================="
echo ""

# Check Node.js version
NODE_VERSION=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1)
if [ -z "$NODE_VERSION" ] || [ "$NODE_VERSION" -lt 18 ]; then
    echo "Error: Node.js 18 or higher is required."
    echo "Current version: $(node -v 2>/dev/null || echo 'not installed')"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js version: $(node -v)"

# Check npm
NPM_VERSION=$(npm -v 2>/dev/null)
if [ -z "$NPM_VERSION" ]; then
    echo "Error: npm is not installed."
    exit 1
fi
echo "✓ npm version: $NPM_VERSION"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"
echo ""

# Step 1: Install dependencies
echo "=========================================="
echo "Step 1: Installing dependencies..."
echo "=========================================="

if [ ! -f "package.json" ]; then
    echo "Creating Next.js project..."

    # Create Next.js project with all required options
    npx create-next-app@latest . \
        --typescript \
        --eslint \
        --tailwind \
        --app \
        --src-dir=false \
        --import-alias="@/*" \
        --use-npm

    echo "✓ Next.js project created"
else
    echo "package.json exists, installing dependencies..."
    npm install
fi

echo ""
echo "Installing additional dependencies..."

# Core dependencies
npm install drizzle-orm @neondatabase/serverless

# Dev dependencies
npm install -D drizzle-kit

# AI SDK for chatbot
npm install ai @ai-sdk/openai

# Authentication
npm install bcryptjs
npm install -D @types/bcryptjs
npm install jose

# Internationalization
npm install next-intl

# File upload and S3 (R2) client
npm install @aws-sdk/client-s3

# Email service
npm install resend

# UI utilities
npm install clsx tailwind-merge
npm install lucide-react

# 3D viewer dependencies
npm install three @sparkjsdev/spark
npm install -D @types/three

echo "✓ All dependencies installed"
echo ""

# Step 2: Create environment file from template
echo "=========================================="
echo "Step 2: Setting up environment variables..."
echo "=========================================="

if [ ! -f ".env.local" ] && [ -f ".env.local.example" ]; then
    cp .env.local.example .env.local
    echo "✓ Created .env.local from template"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env.local and add your actual credentials:"
    echo "   - DATABASE_URL (Neon Postgres connection string)"
    echo "   - R2 credentials (Cloudflare R2)"
    echo "   - RESEND_API_KEY"
    echo "   - OPENAI_API_KEY"
    echo "   - WORLD_LABS_API_KEY"
    echo "   - AUTH_SECRET (generate with: openssl rand -base64 32)"
else
    if [ -f ".env.local" ]; then
        echo "✓ .env.local already exists"
    else
        echo "⚠️  .env.local.example not found. Please create .env.local manually."
    fi
fi
echo ""

# Step 3: Create project structure
echo "=========================================="
echo "Step 3: Creating project structure..."
echo "=========================================="

# Create directory structure
mkdir -p app/\(admin\)/admin/login
mkdir -p app/\(admin\)/admin/dashboard
mkdir -p app/\(admin\)/admin/inventory
mkdir -p app/\(admin\)/admin/orders
mkdir -p app/\(admin\)/admin/customers
mkdir -p app/\(admin\)/admin/calculator-settings

mkdir -p app/\(client\)/register
mkdir -p app/\(client\)/login
mkdir -p app/\(client\)/browse
mkdir -p app/\(client\)/account/orders
mkdir -p app/\(client\)/chat

mkdir -p app/platform-admin/login
mkdir -p app/platform-admin/tenants

mkdir -p app/api/auth/register
mkdir -p app/api/auth/login
mkdir -p app/api/chat
mkdir -p app/api/orders
mkdir -p app/api/reconstruction
mkdir -p app/api/platform-admin/auth/login
mkdir -p app/api/admin/auth/login

mkdir -p components/ui
mkdir -p components/chat
mkdir -p components/inventory
mkdir -p components/orders

mkdir -p lib

mkdir -p drizzle

echo "✓ Directory structure created"
echo ""

# Step 4: Initialize Drizzle
echo "=========================================="
echo "Step 4: Database setup..."
echo "=========================================="

if [ -f "drizzle/schema.ts" ]; then
    echo "Schema file exists."

    # Check if DATABASE_URL is set
    if grep -q "your_neon_connection_string" .env.local 2>/dev/null || ! grep -q "DATABASE_URL" .env.local 2>/dev/null; then
        echo "⚠️  DATABASE_URL not configured. Skipping database push."
        echo "   Please configure DATABASE_URL in .env.local and run:"
        echo "   npx drizzle-kit push"
    else
        echo "Pushing schema to database..."
        npx drizzle-kit push
        echo "✓ Database schema pushed"
    fi
else
    echo "⚠️  drizzle/schema.ts not found. Please create the schema file."
fi
echo ""

# Step 5: Generate Drizzle types
echo "=========================================="
echo "Step 5: Generating types..."
echo "=========================================="

if [ -f "drizzle/schema.ts" ]; then
    npx drizzle-kit generate
    echo "✓ Drizzle types generated"
else
    echo "⚠️  Skipping type generation (no schema)"
fi
echo ""

# Step 6: Start development server
echo "=========================================="
echo "Step 6: Ready to start!"
echo "=========================================="
echo ""
echo "To start the development server, run:"
echo ""
echo "    npm run dev"
echo ""
echo "Then open http://localhost:3000 in your browser."
echo ""
echo "=========================================="
echo "  Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Configure .env.local with your credentials"
echo "2. Run 'npx drizzle-kit push' to create database tables"
echo "3. Run 'npm run dev' to start the development server"
echo ""
echo "For multi-tenant testing locally:"
echo "- Add test domains to /etc/hosts:"
echo "  127.0.0.1 tenant1.localhost"
echo "  127.0.0.1 tenant2.localhost"
echo "- Access via http://tenant1.localhost:3000"
echo ""
