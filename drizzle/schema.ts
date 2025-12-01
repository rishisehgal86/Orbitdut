import { boolean, decimal, foreignKey, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  role: mysqlEnum("role", ["supplier_admin", "supplier_tech"]).default("supplier_tech").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("supplierUsers_userId_idx").on(table.userId),
  supplierIdIdx: index("supplierUsers_supplierId_idx").on(table.supplierId),
  uniqueUserSupplier: index("supplierUsers_unique").on(table.userId, table.supplierId),
}));

export type SupplierUser = typeof supplierUsers.$inferSelect;
export type InsertSupplierUser = typeof supplierUsers.$inferInsert;

/**
 * Supplier rates table - stores hourly rates per location, service type, and response time
 * Three-dimensional pricing matrix: Location × Service Type × Response Time
 */
export const supplierRates = mysqlTable("supplierRates", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  
  // Location: Country OR Priority City (mutually exclusive)
  countryCode: varchar("countryCode", { length: 2 }), // ISO 3166-1 alpha-2 (null if cityId is set)
  cityId: int("cityId").references(() => supplierPriorityCities.id, { onDelete: "cascade" }), // References supplierPriorityCities (null if countryCode is set)
  
  // Service Type: L1_EUC, L1_NETWORK, SMART_HANDS
  serviceType: varchar("serviceType", { length: 50 }).notNull(),
  
  // Response Time: 4, 24, 48, 72, 96 (hours)
  responseTimeHours: int("responseTimeHours").notNull(),
  
  // Rate in USD cents (nullable - allows opt-out)
  rateUsdCents: int("rateUsdCents"),
  
  // Service status: null = not configured, 0 = not offered (opted out), 1 = active
  isServiceable: int("isServiceable", { unsigned: true }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Index for tenant isolation queries
  supplierIdIdx: index("supplierRates_supplierId_idx").on(table.supplierId),
  // Composite unique constraint: prevent duplicate rates for same location/service/response time
  uniqueRate: index("supplierRates_unique").on(
    table.supplierId,
    table.countryCode,
    table.cityId,
    table.serviceType,
    table.responseTimeHours
  ),
}));

export type SupplierRate = typeof supplierRates.$inferSelect;
export type InsertSupplierRate = typeof supplierRates.$inferInsert;

/**
 * Supplier coverage table - Tier 1: Country-level coverage
 */
export const supplierCoverageCountries = mysqlTable("supplierCoverageCountries", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  countryCode: varchar("countryCode", { length: 2 }).notNull(), // ISO 3166-1 alpha-2
  isExcluded: int("isExcluded", { unsigned: true }).default(0).notNull(), // 0 = included, 1 = excluded (Tier 3)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  supplierIdIdx: index("supplierCoverageCountries_supplierId_idx").on(table.supplierId),
  uniqueCountry: index("supplierCoverageCountries_unique").on(table.supplierId, table.countryCode),
}));

export type SupplierCoverageCountry = typeof supplierCoverageCountries.$inferSelect;
export type InsertSupplierCoverageCountry = typeof supplierCoverageCountries.$inferInsert;

/**
 * Supplier priority cities - Tier 2: City/metro area refinement
 */
export const supplierPriorityCities = mysqlTable("supplierPriorityCities", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  countryCode: varchar("countryCode", { length: 2 }).notNull(),
  cityName: varchar("cityName", { length: 255 }).notNull(),
  stateProvince: varchar("stateProvince", { length: 255 }), // State/Province/Region
  placeId: varchar("placeId", { length: 255 }), // Google Places ID for uniqueness
  formattedAddress: text("formattedAddress"), // Full formatted address from Google
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // Decimal for precise coordinates
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  supplierIdIdx: index("supplierPriorityCities_supplierId_idx").on(table.supplierId),
  uniqueCity: index("supplierPriorityCities_unique").on(table.supplierId, table.placeId),
}));

export type SupplierPriorityCity = typeof supplierPriorityCities.$inferSelect;
export type InsertSupplierPriorityCity = typeof supplierPriorityCities.$inferInsert;

/**
 * Supplier response times - Tier 4: Response time zones by region
 */
export const supplierResponseTimes = mysqlTable("supplierResponseTimes", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  countryCode: varchar("countryCode", { length: 2 }), // NULL = global default
  cityName: varchar("cityName", { length: 255 }), // NULL = country-level or global
  responseTimeHours: int("responseTimeHours").notNull(), // 4, 24, 48, 72, 96
  isDefault: int("isDefault", { unsigned: true }).default(0).notNull(), // 1 = global default
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdIdx: index("supplierResponseTimes_supplierId_idx").on(table.supplierId),
  uniqueResponseTime: index("supplierResponseTimes_unique").on(table.supplierId, table.countryCode, table.cityName, table.responseTimeHours),
}));

export type SupplierResponseTime = typeof supplierResponseTimes.$inferSelect;
export type InsertSupplierResponseTime = typeof supplierResponseTimes.$inferInsert;

/**
 * Jobs table - stores customer service requests
 */
export const jobs = mysqlTable("jobs", {
  id: int("id").autoincrement().primaryKey(),
  
  // Marketplace fields
  customerId: int("customerId").references(() => users.id, { onDelete: "set null" }), // Can be null for guest requests
  assignedSupplierId: int("assignedSupplierId").references(() => suppliers.id, { onDelete: "set null" }),
  
  // Unique identifier for shareable links
  jobToken: varchar("jobToken", { length: 64 }).notNull().unique(),
  
  // Customer Information
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 320 }).notNull(),
  customerPhone: varchar("customerPhone", { length: 50 }),
  
  // Site Information
  siteName: varchar("siteName", { length: 255 }),
  siteId: varchar("siteId", { length: 100 }),
  siteAddress: text("siteAddress").notNull(),
  siteLatitude: varchar("siteLatitude", { length: 50 }),
  siteLongitude: varchar("siteLongitude", { length: 50 }),
  city: varchar("city", { length: 100 }),
  siteState: varchar("siteState", { length: 100 }),
  country: varchar("country", { length: 2 }).notNull(),
  postalCode: varchar("postalCode", { length: 20 }),
  
  // Site Contact Information
  siteContactName: varchar("siteContactName", { length: 255 }),
  siteContactNumber: varchar("siteContactNumber", { length: 50 }),
  
  // Service Details
  serviceType: varchar("serviceType", { length: 100 }).notNull(),
  description: text("description"),
  incidentDetails: text("incidentDetails"),
  scopeOfWork: text("scopeOfWork"),
  
  // Job Reference Numbers
  projectName: varchar("projectName", { length: 255 }),
  changeNumber: varchar("changeNumber", { length: 100 }),
  incidentNumber: varchar("incidentNumber", { length: 100 }),
  
  // Technical Requirements
  toolsRequired: text("toolsRequired"),
  deviceDetails: text("deviceDetails"),
  downTime: boolean("downTime").default(false),
  accessInstructions: text("accessInstructions"),
  specialRequirements: text("specialRequirements"),
  equipmentNeeded: text("equipmentNeeded"),
  
  // Scheduling
  scheduledDateTime: timestamp("scheduledDateTime"),
  hoursRequired: varchar("hoursRequired", { length: 100 }),
  estimatedDuration: int("estimatedDuration"), // In minutes
  
  // Booking Type and Duration
  bookingType: mysqlEnum("bookingType", ["full_day", "hourly", "multi_day"]),
  estimatedHours: int("estimatedHours"), // For hourly bookings
  estimatedDays: int("estimatedDays"), // For multi-day bookings
  
  // Time Scheduling and Negotiation
  requestedStartDate: timestamp("requestedStartDate"),
  requestedStartTime: varchar("requestedStartTime", { length: 10 }), // HH:MM format
  proposedStartDate: timestamp("proposedStartDate"), // Supplier counter-proposal
  proposedStartTime: varchar("proposedStartTime", { length: 10 }),
  confirmedStartDate: timestamp("confirmedStartDate"), // Final confirmed schedule
  confirmedStartTime: varchar("confirmedStartTime", { length: 10 }),
  timeNegotiationNotes: text("timeNegotiationNotes"),
  
  // Timezone - IANA timezone identifier (e.g., 'America/New_York', 'Asia/Dubai')
  timezone: varchar("timezone", { length: 100 }),
  
  // Pricing (Marketplace)
  isOutOfHours: int("isOutOfHours", { unsigned: true }).default(0).notNull(),
  calculatedPrice: int("calculatedPrice"), // In cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Additional Information
  notes: text("notes"),
  videoConferenceLink: varchar("videoConferenceLink", { length: 500 }),
  coveredByCOI: boolean("coveredByCOI").default(true),
  
  // Job Status
  status: mysqlEnum("status", [
    "pending_supplier_acceptance",
    "assigned_to_supplier",
    "accepted",
    "declined",
    "en_route",
    "on_site",
    "completed",
    "cancelled"
  ]).default("pending_supplier_acceptance").notNull(),
  
  // Engineer/Technician Information
  engineerName: varchar("engineerName", { length: 255 }),
  engineerEmail: varchar("engineerEmail", { length: 320 }),
  engineerPhone: varchar("engineerPhone", { length: 50 }),
  
  // Timestamps
  acceptedAt: timestamp("acceptedAt"),
  enRouteAt: timestamp("enRouteAt"),
  arrivedAt: timestamp("arrivedAt"),
  completedAt: timestamp("completedAt"),
  cancelledAt: timestamp("cancelledAt"),
  
  // Cancellation tracking
  cancellationReason: varchar("cancellationReason", { length: 500 }),
  cancelledBy: varchar("cancelledBy", { length: 255 }), // Name of person who cancelled
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  customerIdIdx: index("jobs_customerId_idx").on(table.customerId),
  assignedSupplierIdIdx: index("jobs_assignedSupplierId_idx").on(table.assignedSupplierId),
  statusIdx: index("jobs_status_idx").on(table.status),
}));

export type Job = typeof jobs.$inferSelect;
export type InsertJob = typeof jobs.$inferInsert;

/**
 * Payments table - tracks customer payments and supplier payouts
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  paymentType: mysqlEnum("paymentType", ["customer_payment", "supplier_payout"]).notNull(),
  amount: int("amount").notNull(), // In cents
  currency: varchar("currency", { length: 3 }).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeTransferId: varchar("stripeTransferId", { length: 255 }),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed", "refunded"]).default("pending").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  jobIdIdx: index("payments_jobId_idx").on(table.jobId),
  paymentTypeIdx: index("payments_paymentType_idx").on(table.paymentType),
  statusIdx: index("payments_status_idx").on(table.status),
}));

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * Reviews table - stores customer ratings and feedback for suppliers
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  customerId: int("customerId").references(() => users.id, { onDelete: "set null" }),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("reviews_jobId_idx").on(table.jobId),
  supplierIdIdx: index("reviews_supplierId_idx").on(table.supplierId),
  customerIdIdx: index("reviews_customerId_idx").on(table.customerId),
}));

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Supplier service exclusions - allows suppliers to mark specific service/location combinations as non-serviceable
 * This is a coverage-level exclusion that prevents rates from being required for excluded combinations
 */
export const supplierServiceExclusions = mysqlTable("supplierServiceExclusions", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  
  // Location: Country OR Priority City (mutually exclusive)
  countryCode: varchar("countryCode", { length: 2 }), // ISO 3166-1 alpha-2 (null if cityId is set)
  cityId: int("cityId").references(() => supplierPriorityCities.id, { onDelete: "cascade" }), // References supplierPriorityCities (null if countryCode is set)
  
  // Service Type: L1_EUC, L1_NETWORK, SMART_HANDS
  serviceType: varchar("serviceType", { length: 50 }).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // Index for tenant isolation queries
  supplierIdIdx: index("supplierServiceExclusions_supplierId_idx").on(table.supplierId),
  // Composite unique constraint: prevent duplicate exclusions
  uniqueExclusion: index("supplierServiceExclusions_unique").on(
    table.supplierId,
    table.countryCode,
    table.cityId,
    table.serviceType
  ),
}));

export type SupplierServiceExclusion = typeof supplierServiceExclusions.$inferSelect;
export type InsertSupplierServiceExclusion = typeof supplierServiceExclusions.$inferInsert;

/**
 * Supplier response time exclusions - allows suppliers to mark specific response times as not offered
 * for individual service/location combinations. More granular than service-level exclusions.
 * Example: "We offer L1 EUC in London, but only for 24h+ response times, not 4h"
 */
export const supplierResponseTimeExclusions = mysqlTable("supplierResponseTimeExclusions", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  
  // Location: Country OR Priority City (mutually exclusive)
  countryCode: varchar("countryCode", { length: 2 }), // ISO 3166-1 alpha-2 (null if cityId is set)
  cityId: int("cityId"), // References supplierPriorityCities (null if countryCode is set)
  
  // Service Type: L1_EUC, L1_NETWORK, SMART_HANDS
  serviceType: varchar("serviceType", { length: 50 }).notNull(),
  
  // Response Time Hours: 4, 24, 48, 72, 96
  responseTimeHours: int("responseTimeHours").notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // Foreign keys with custom short names
  supplierFk: foreignKey({
    name: "rtExcl_supplier_fk",
    columns: [table.supplierId],
    foreignColumns: [suppliers.id],
  }).onDelete("cascade"),
  cityFk: foreignKey({
    name: "rtExcl_city_fk",
    columns: [table.cityId],
    foreignColumns: [supplierPriorityCities.id],
  }).onDelete("cascade"),
  // Index for tenant isolation queries
  supplierIdIdx: index("rtExcl_supplierId_idx").on(table.supplierId),
  // Composite unique constraint: prevent duplicate exclusions
  uniqueExclusion: index("rtExcl_unique").on(
    table.supplierId,
    table.countryCode,
    table.cityId,
    table.serviceType,
    table.responseTimeHours
  ),
}));

export type SupplierResponseTimeExclusion = typeof supplierResponseTimeExclusions.$inferSelect;
export type InsertSupplierResponseTimeExclusion = typeof supplierResponseTimeExclusions.$inferInsert;