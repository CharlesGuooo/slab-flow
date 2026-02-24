import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  boolean,
  decimal,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// TENANTS TABLE (All merchants' "household registration")
// ============================================================
export const tenants = pgTable('tenants', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "StoneMaster NYC"
  domain: varchar('domain', { length: 255 }).notNull().unique(), // Main domain binding
  isActive: boolean('is_active').default(true).notNull(), // Service toggle

  // Theme configuration (White-label)
  themePrimaryColor: varchar('theme_primary_color', { length: 7 }).default('#000000'),
  themeLogoUrl: text('theme_logo_url'),
  themeBannerUrl: text('theme_banner_url'),

  // Feature flags
  featureChatbot: boolean('feature_chatbot').default(true),
  featureCalculator: boolean('feature_calculator').default(true),
  feature3dReconstruction: boolean('feature_3d_reconstruction').default(false),

  // Contact information
  contactPhone: varchar('contact_phone', { length: 30 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  address: text('address'),

  // AI configuration
  aiSystemPrompt: text('ai_system_prompt'), // Optional personalized AI system prompt
  aiMonthlyBudget: decimal('ai_monthly_budget', { precision: 12, scale: 2 }).default('50.00'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// USERS TABLE (Customers - scoped to tenant)
// ============================================================
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  username: varchar('username', { length: 256 }).notNull(),
  email: varchar('email', { length: 256 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  pin: text('pin'), // bcrypt hashed PIN
  aiCredits: decimal('ai_credits', { precision: 10, scale: 2 }).default('10.00'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// ADMINS TABLE (Super admin and tenant admin)
// ============================================================
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => tenants.id), // NULL for super_admin
  role: varchar('role', { enum: ['super_admin', 'tenant_admin'] })
    .default('tenant_admin')
    .notNull(),
  email: varchar('email', { length: 256 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// INVENTORY_STONES TABLE (Stone inventory - scoped to tenant)
// ============================================================
export const inventoryStones = pgTable('inventory_stones', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  brand: varchar('brand', { length: 256 }).notNull(),
  series: varchar('series', { length: 256 }).notNull(),
  stoneType: varchar('stone_type', {
    enum: ['quartz', 'granite', 'marble', 'quartzite', 'porcelain'],
  }),
  pricePerSlab: decimal('price_per_slab', { precision: 10, scale: 2 }),
  imageUrl: text('image_url').notNull(),
  name: jsonb('name'), // Multi-language name { en: "", zh: "", fr: "" }
  description: jsonb('description'), // Multi-language description
  tags: jsonb('tags'), // Internal tag system
  isActive: boolean('is_active').default(true).notNull(), // Soft delete flag
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// CLIENT_ORDERS TABLE (Quote requests - scoped to tenant)
// ============================================================
export const clientOrders = pgTable('client_orders', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  stoneId: integer('stone_id').references(() => inventoryStones.id),
  stoneSelectionText: text('stone_selection_text'), // For "AI recommend" option
  desiredDate: varchar('desired_date', {
    enum: ['ASAP', 'within_2_weeks', 'within_a_month', 'not_in_a_hurry'],
  }),
  isContractor: boolean('is_contractor').default(false),
  totalBudget: decimal('total_budget', { precision: 12, scale: 2 }),
  notes: text('notes'), // Customer remarks
  status: varchar('status', {
    enum: ['pending_quote', 'quoted', 'in_progress', 'completed', 'cancelled'],
  }).default('pending_quote'),
  finalQuotePrice: decimal('final_quote_price', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================================
// ORDER_PHOTOS TABLE (Photos attached to orders)
// ============================================================
export const orderPhotos = pgTable('order_photos', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  orderId: integer('order_id')
    .references(() => clientOrders.id)
    .notNull(),
  imageUrl: text('image_url').notNull(),
  photoType: varchar('photo_type', { enum: ['user_upload', 'ai_generated'] }).notNull(),
  gaussianSplatUrl: text('gaussian_splat_url'), // SPZ file URL on our R2
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================
// CALCULATION_ITEMS TABLE (Fabrication pricing - scoped to tenant)
// ============================================================
export const calculationItems = pgTable('calculation_items', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  unit: varchar('unit', { enum: ['per_sqft', 'per_unit', 'per_hour'] }).notNull(),
  pricePerUnit: decimal('price_per_unit', { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
