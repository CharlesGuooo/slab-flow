import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../drizzle/schema-sqlite';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Check if we're in development mode without DATABASE_URL
const useLocalDb = !process.env.DATABASE_URL || process.env.USE_LOCAL_DB === 'true';

// SQLite database for local development
const sqlite = new Database('slabflow-local.db');
export const db = drizzle(sqlite, { schema });

// Re-export schema for convenience
export * from '../drizzle/schema-sqlite';

// Initialize local database with seed data
export async function initializeLocalDatabase() {
  if (!useLocalDb) return;

  console.log('Initializing local SQLite database...');

  // Create tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
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
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id),
      role TEXT DEFAULT 'tenant_admin' NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      pin TEXT,
      ai_credits TEXT DEFAULT '10.00',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_stones (
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
    );

    CREATE TABLE IF NOT EXISTS client_orders (
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
    );

    CREATE TABLE IF NOT EXISTS order_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
      order_id INTEGER REFERENCES client_orders(id) NOT NULL,
      image_url TEXT NOT NULL,
      photo_type TEXT NOT NULL,
      gaussian_splat_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS calculation_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER REFERENCES tenants(id) NOT NULL,
      name TEXT NOT NULL,
      unit TEXT NOT NULL,
      price_per_unit TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);

  // Check if we already have data
  const adminCount = sqlite.prepare('SELECT COUNT(*) as count FROM admins').get() as { count: number };
  if (adminCount.count > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding database with initial data...');

  // Create super admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  sqlite.prepare(`
    INSERT INTO admins (tenant_id, role, email, password_hash)
    VALUES (NULL, 'super_admin', 'admin@slabflow.local', ?)
  `).run(hashedPassword);

  // Create test tenant
  const tenantResult = sqlite.prepare(`
    INSERT INTO tenants (name, domain, is_active, contact_email, contact_phone)
    VALUES ('Test Stone Company', 'test-company.localhost', 1, 'info@test-company.com', '555-123-4567')
  `).run();

  const tenantId = tenantResult.lastInsertRowid;

  // Create tenant admin
  const tenantAdminPassword = await bcrypt.hash('tenant123', 10);
  sqlite.prepare(`
    INSERT INTO admins (tenant_id, role, email, password_hash)
    VALUES (?, 'tenant_admin', 'admin@test-company.localhost', ?)
  `).run(tenantId, tenantAdminPassword);

  // Create some sample stones
  sqlite.prepare(`
    INSERT INTO inventory_stones (tenant_id, brand, series, stone_type, price_per_slab, image_url, name)
    VALUES (?, 'Caesarstone', 'Classic', 'quartz', '1200.00', '/images/sample-stone.jpg', '{"en": "White Granite", "zh": "白花岗岩"}')
  `).run(tenantId);

  sqlite.prepare(`
    INSERT INTO inventory_stones (tenant_id, brand, series, stone_type, price_per_slab, image_url, name)
    VALUES (?, 'Silestone', 'Eternal', 'quartz', '1500.00', '/images/sample-stone-2.jpg', '{"en": "Calacatta Gold", "zh": "卡拉卡塔金"}')
  `).run(tenantId);

  // Create default calculation items
  sqlite.prepare(`
    INSERT INTO calculation_items (tenant_id, name, unit, price_per_unit, sort_order)
    VALUES (?, 'Straight Cut', 'per_unit', '50.00', 1)
  `).run(tenantId);

  sqlite.prepare(`
    INSERT INTO calculation_items (tenant_id, name, unit, price_per_unit, sort_order)
    VALUES (?, 'Mitered Edge', 'per_sqft', '35.00', 2)
  `).run(tenantId);

  sqlite.prepare(`
    INSERT INTO calculation_items (tenant_id, name, unit, price_per_unit, sort_order)
    VALUES (?, 'Installation', 'per_sqft', '25.00', 3)
  `).run(tenantId);

  console.log('Database seeded successfully!');
  console.log('');
  console.log('=== Test Credentials ===');
  console.log('Super Admin: admin@slabflow.local / admin123');
  console.log('Tenant Admin: admin@test-company.localhost / tenant123');
  console.log('========================');
  console.log('');
}

// Initialize on first import
initializeLocalDatabase().catch(console.error);
