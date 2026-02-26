/**
 * Initialize Turso database - create tables and seed basic data
 * Run with: npx tsx scripts/init-turso.ts
 */
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local');
  process.exit(1);
}

console.log(`Connecting to: ${url}`);

const db = createClient({ url, authToken });

async function init() {
  console.log('📋 Creating tables...\n');

  // Create tables one by one (executeMultiple may not work well with Turso)
  const tables = [
    `CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      domain TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1 NOT NULL,
      theme_primary_color TEXT DEFAULT '#000000',
      theme_logo_url TEXT,
      theme_banner_url TEXT,
      feature_chatbot INTEGER DEFAULT 1,
      feature_calculator INTEGER DEFAULT 1,
      feature_3d_reconstruction INTEGER DEFAULT 0,
      contact_phone TEXT,
      contact_email TEXT,
      address TEXT,
      ai_system_prompt TEXT,
      ai_monthly_budget TEXT DEFAULT '50.00',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id),
      role TEXT DEFAULT 'tenant_admin' NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      pin TEXT,
      ai_credits TEXT DEFAULT '10.00',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS inventory_stones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
      brand TEXT NOT NULL,
      series TEXT NOT NULL,
      stone_type TEXT,
      price_per_slab TEXT,
      image_url TEXT NOT NULL,
      name TEXT,
      description TEXT,
      tags TEXT,
      is_active INTEGER DEFAULT 1 NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS client_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      stone_id INTEGER REFERENCES inventory_stones(id),
      stone_selection_text TEXT,
      desired_date TEXT,
      is_contractor INTEGER DEFAULT 0,
      total_budget TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending_quote',
      final_quote_price TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS order_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
      order_id INTEGER REFERENCES client_orders(id) NOT NULL,
      image_url TEXT NOT NULL,
      photo_type TEXT NOT NULL,
      gaussian_splat_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS calculation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      price_per_unit TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`,
  ];

  for (const sql of tables) {
    await db.execute(sql);
  }
  console.log('✅ All tables created!\n');

  // Check if already seeded
  const result = await db.execute('SELECT COUNT(*) as count FROM admins');
  if ((result.rows[0].count as number) > 0) {
    console.log('Database already has data. Skipping seed.');
    return;
  }

  console.log('🌱 Seeding initial data...\n');

  // Create super admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.execute({
    sql: `INSERT INTO admins (tenant_id, role, email, password_hash) VALUES (NULL, 'super_admin', 'admin@slabflow.local', ?)`,
    args: [hashedPassword],
  });
  console.log('✅ Super admin created: admin@slabflow.local / admin123');

  // Create test tenant
  const tenantResult = await db.execute({
    sql: `INSERT INTO tenants (name, domain, is_active, contact_email, contact_phone) VALUES ('Test Stone Company', 'test-company.localhost', 1, 'info@test-company.com', '555-123-4567')`,
    args: [],
  });
  const tenantId = Number(tenantResult.lastInsertRowid);
  console.log(`✅ Test tenant created (ID: ${tenantId})`);

  // Create tenant admin
  const tenantAdminPassword = await bcrypt.hash('tenant123', 10);
  await db.execute({
    sql: `INSERT INTO admins (tenant_id, role, email, password_hash) VALUES (?, 'tenant_admin', 'admin@test-company.localhost', ?)`,
    args: [tenantId, tenantAdminPassword],
  });
  console.log('✅ Tenant admin created: admin@test-company.localhost / tenant123');

  console.log('\n🎉 Database initialization complete!');
  console.log('\nNow run: npx tsx scripts/seed-demo-data.ts');
}

init().catch(console.error);
