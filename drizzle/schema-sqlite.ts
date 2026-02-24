import {
  sqliteTable,
  integer,
  text,
  real,
} from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// ============================================================
// TENANTS TABLE (All merchants' "household registration")
// ============================================================
export const tenants = sqliteTable('tenants', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  domain: text('domain').notNull().unique(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),

  // Theme configuration (White-label)
  themePrimaryColor: text('theme_primary_color').default('#000000'),
  themeLogoUrl: text('theme_logo_url'),
  themeBannerUrl: text('theme_banner_url'),

  // Feature flags
  featureChatbot: integer('feature_chatbot', { mode: 'boolean' }).default(true),
  featureCalculator: integer('feature_calculator', { mode: 'boolean' }).default(true),
  feature3dReconstruction: integer('feature_3d_reconstruction', { mode: 'boolean' }).default(false),

  // Contact information
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  address: text('address'),

  // AI configuration
  aiSystemPrompt: text('ai_system_prompt'),
  aiMonthlyBudget: text('ai_monthly_budget').default('50.00'),

  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================
// USERS TABLE (Customers - scoped to tenant)
// ============================================================
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  username: text('username').notNull(),
  email: text('email').notNull(),
  phone: text('phone'),
  pin: text('pin'),
  aiCredits: text('ai_credits').default('10.00'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================
// ADMINS TABLE (Super admin and tenant admin)
// ============================================================
export const admins = sqliteTable('admins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id').references(() => tenants.id),
  role: text('role', { enum: ['super_admin', 'tenant_admin'] })
    .default('tenant_admin')
    .notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================
// INVENTORY_STONES TABLE (Stone inventory - scoped to tenant)
// ============================================================
export const inventoryStones = sqliteTable('inventory_stones', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  brand: text('brand').notNull(),
  series: text('series').notNull(),
  stoneType: text('stone_type', {
    enum: ['quartz', 'granite', 'marble', 'quartzite', 'porcelain'],
  }),
  pricePerSlab: text('price_per_slab'),
  imageUrl: text('image_url').notNull(),
  name: text('name'), // JSON string for multi-language
  description: text('description'), // JSON string for multi-language
  tags: text('tags'), // JSON string for tags
  isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================
// CLIENT_ORDERS TABLE (Quote requests - scoped to tenant)
// ============================================================
export const clientOrders = sqliteTable('client_orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  stoneId: integer('stone_id').references(() => inventoryStones.id),
  stoneSelectionText: text('stone_selection_text'),
  desiredDate: text('desired_date', {
    enum: ['ASAP', 'within_2_weeks', 'within_a_month', 'not_in_a_hurry'],
  }),
  isContractor: integer('is_contractor', { mode: 'boolean' }).default(false),
  totalBudget: text('total_budget'),
  notes: text('notes'),
  status: text('status', {
    enum: ['pending_quote', 'quoted', 'in_progress', 'completed', 'cancelled'],
  }).default('pending_quote'),
  finalQuotePrice: text('final_quote_price'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================
// ORDER_PHOTOS TABLE (Photos attached to orders)
// ============================================================
export const orderPhotos = sqliteTable('order_photos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  orderId: integer('order_id')
    .references(() => clientOrders.id)
    .notNull(),
  imageUrl: text('image_url').notNull(),
  photoType: text('photo_type', { enum: ['user_upload', 'ai_generated'] }).notNull(),
  gaussianSplatUrl: text('gaussian_splat_url'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================
// CALCULATION_ITEMS TABLE (Fabrication pricing - scoped to tenant)
// ============================================================
export const calculationItems = sqliteTable('calculation_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  name: text('name').notNull(),
  unit: text('unit', { enum: ['per_sqft', 'per_unit', 'per_hour'] }).notNull(),
  pricePerUnit: text('price_per_unit').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ============================================================
// RELATIONS
// ============================================================
export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  admins: many(admins),
  inventoryStones: many(inventoryStones),
  clientOrders: many(clientOrders),
  calculationItems: many(calculationItems),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  orders: many(clientOrders),
}));

export const adminsRelations = relations(admins, ({ one }) => ({
  tenant: one(tenants, {
    fields: [admins.tenantId],
    references: [tenants.id],
  }),
}));

export const inventoryStonesRelations = relations(inventoryStones, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [inventoryStones.tenantId],
    references: [tenants.id],
  }),
  orders: many(clientOrders),
}));

export const clientOrdersRelations = relations(clientOrders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [clientOrders.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [clientOrders.userId],
    references: [users.id],
  }),
  stone: one(inventoryStones, {
    fields: [clientOrders.stoneId],
    references: [inventoryStones.id],
  }),
  photos: many(orderPhotos),
}));

export const orderPhotosRelations = relations(orderPhotos, ({ one }) => ({
  tenant: one(tenants, {
    fields: [orderPhotos.tenantId],
    references: [tenants.id],
  }),
  order: one(clientOrders, {
    fields: [orderPhotos.orderId],
    references: [clientOrders.id],
  }),
}));

export const calculationItemsRelations = relations(calculationItems, ({ one }) => ({
  tenant: one(tenants, {
    fields: [calculationItems.tenantId],
    references: [tenants.id],
  }),
}));

// ============================================================
// TYPE EXPORTS
// ============================================================
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;
export type InventoryStone = typeof inventoryStones.$inferSelect;
export type NewInventoryStone = typeof inventoryStones.$inferInsert;
export type ClientOrder = typeof clientOrders.$inferSelect;
export type NewClientOrder = typeof clientOrders.$inferInsert;
export type OrderPhoto = typeof orderPhotos.$inferSelect;
export type NewOrderPhoto = typeof orderPhotos.$inferInsert;
export type CalculationItem = typeof calculationItems.$inferSelect;
export type NewCalculationItem = typeof calculationItems.$inferInsert;
