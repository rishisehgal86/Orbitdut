import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. Optional for local auth. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** Password hash for local authentication. Null for OAuth users. */
  passwordHash: text("passwordHash"),
  /** Account type: customer or supplier */
  accountType: mysqlEnum("accountType", ["customer", "supplier"]).notNull(),
  loginMethod: varchar("loginMethod", { length: 64 }).default("local"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Supplier companies table - stores business information for service providers
 */
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 255 }).notNull(),
  contactEmail: varchar("contactEmail", { length: 320 }).notNull(),
  contactPhone: varchar("contactPhone", { length: 50 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  country: varchar("country", { length: 2 }).notNull(), // ISO 3166-1 alpha-2
  taxId: varchar("taxId", { length: 100 }),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "verified", "rejected"]).default("pending").notNull(),
  stripeAccountId: varchar("stripeAccountId", { length: 255 }),
  isActive: int("isActive", { unsigned: true }).default(1).notNull(), // 1 = active, 0 = inactive
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

/**
 * Supplier users table - links individual users to supplier companies
 */
export const supplierUsers = mysqlTable("supplierUsers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  supplierId: int("supplierId").notNull(),
  role: mysqlEnum("role", ["supplier_admin", "supplier_tech"]).default("supplier_tech").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SupplierUser = typeof supplierUsers.$inferSelect;
export type InsertSupplierUser = typeof supplierUsers.$inferInsert;

/**
 * Supplier rates table - stores hourly rates per country
 */
export const supplierRates = mysqlTable("supplierRates", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  country: varchar("country", { length: 2 }).notNull(), // ISO 3166-1 alpha-2
  hourlyRate: int("hourlyRate").notNull(), // Stored in cents to avoid decimal issues
  currency: varchar("currency", { length: 3 }).notNull(), // ISO 4217 (USD, EUR, GBP, etc.)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierRate = typeof supplierRates.$inferSelect;
export type InsertSupplierRate = typeof supplierRates.$inferInsert;

/**
 * Supplier coverage table - defines geographic service areas
 */
export const supplierCoverage = mysqlTable("supplierCoverage", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  coverageType: mysqlEnum("coverageType", ["postal_codes", "city_radius", "polygon"]).notNull(),
  country: varchar("country", { length: 2 }).notNull(),
  // For postal_codes: comma-separated list
  // For city_radius: city name
  // For polygon: not used (see geoJson)
  coverageData: text("coverageData"),
  // For city_radius: radius in kilometers
  radiusKm: int("radiusKm"),
  // For city_radius: latitude of city center
  centerLat: varchar("centerLat", { length: 20 }),
  // For city_radius: longitude of city center
  centerLng: varchar("centerLng", { length: 20 }),
  // For polygon: GeoJSON string
  geoJson: text("geoJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SupplierCoverage = typeof supplierCoverage.$inferSelect;
export type InsertSupplierCoverage = typeof supplierCoverage.$inferInsert;

/**
 * Jobs table - stores customer service requests
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId"), // Can be null for guest requests
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }),
  serviceType: varchar("serviceType", { length: 100 }).notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 2 }).notNull(),
  postalCode: varchar("postalCode", { length: 20 }),
  latitude: varchar("latitude", { length: 20 }),
  longitude: varchar("longitude", { length: 20 }),
  scheduledStart: timestamp("scheduledStart").notNull(),
  estimatedDuration: int("estimatedDuration").notNull(), // In minutes
  isOutOfHours: int("isOutOfHours", { unsigned: true }).default(0).notNull(),
  calculatedPrice: int("calculatedPrice").notNull(), // In cents
  currency: varchar("currency", { length: 3 }).notNull(),
  status: mysqlEnum("status", [
    "pending_supplier_acceptance",
    "assigned_to_supplier",
    "en_route",
    "on_site",
    "completed",
    "cancelled"
  ]).default("pending_supplier_acceptance").notNull(),
  assignedSupplierId: int("assignedSupplierId"),
  acceptedAt: timestamp("acceptedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * Payments table - tracks customer payments and supplier payouts
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  paymentType: mysqlEnum("paymentType", ["customer_payment", "supplier_payout"]).notNull(),
  amount: int("amount").notNull(), // In cents
  currency: varchar("currency", { length: 3 }).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeTransferId: varchar("stripeTransferId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "refunded"]).default("pending").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Reviews table - stores customer ratings and feedback for suppliers
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull(),
  supplierId: int("supplierId").notNull(),
  customerId: int("customerId"),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;