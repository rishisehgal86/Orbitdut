import { boolean, decimal, foreignKey, index, int, json, longtext, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "admin", "superadmin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User preferences table - stores customer/supplier preferences and settings
 */
export const userPreferences = mysqlTable("userPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Notification preferences
  emailNotifications: int("emailNotifications", { unsigned: true }).default(1).notNull(), // 1 = enabled, 0 = disabled
  jobStatusUpdates: int("jobStatusUpdates", { unsigned: true }).default(1).notNull(),
  supplierMessages: int("supplierMessages", { unsigned: true }).default(1).notNull(),
  
  // Display preferences
  timezone: varchar("timezone", { length: 100 }).default("UTC"),
  language: varchar("language", { length: 10 }).default("en"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

/**
 * Password reset tokens table - stores temporary tokens for password reset flow
 */
export const passwordResetTokens = mysqlTable("passwordResetTokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

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
  isVerified: int("isVerified", { unsigned: true }).default(0).notNull(), // 0 = not verified, 1 = verified
  stripeAccountId: varchar("stripeAccountId", { length: 255 }),
  isActive: int("isActive", { unsigned: true }).default(1).notNull(), // 1 = active, 0 = inactive
  offersOutOfHours: int("offersOutOfHours", { unsigned: true }).default(1).notNull(), // 0 = no, 1 = yes (default: enabled)
  rating: int("rating").default(200).notNull(), // Rating in hundredths (200 = 2.00/5.00), range 100-500
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
  
  // Service Level: same_business_day, next_business_day, scheduled
  serviceLevel: mysqlEnum("serviceLevel", ["same_business_day", "next_business_day", "scheduled"]).notNull(),
  
  // Rate in USD cents (nullable - allows opt-out)
  rateUsdCents: int("rateUsdCents"),
  
  // Service status: null = not configured, 0 = not offered (opted out), 1 = active
  isServiceable: int("isServiceable", { unsigned: true }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  // Index for tenant isolation queries
  supplierIdIdx: index("supplierRates_supplierId_idx").on(table.supplierId),
  // Composite unique constraint: prevent duplicate rates for same location/service/service level
  uniqueRate: index("supplierRates_unique").on(
    table.supplierId,
    table.countryCode,
    table.cityId,
    table.serviceType,
    table.serviceLevel
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
  oohPremiumPercent: int("oohPremiumPercent"), // OOH premium: 50, 100, or 150
  oohReason: text("oohReason"), // Why it's OOH: evening, weekend, holiday, etc.
  calculatedPrice: int("calculatedPrice"), // In cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Remote Site Fee (distance-based travel surcharge)
  remoteSiteFeeKm: varchar("remoteSiteFeeKm", { length: 20 }), // Billable distance in km (beyond 50km free zone)
  remoteSiteFeeCustomerCents: int("remoteSiteFeeCustomerCents"), // Amount customer pays ($1/km)
  remoteSiteFeeSupplierCents: int("remoteSiteFeeSupplierCents"), // Amount supplier receives ($0.50/km)
  remoteSiteFeePlatformCents: int("remoteSiteFeePlatformCents"), // Platform revenue ($0.50/km)
  nearestMajorCity: varchar("nearestMajorCity", { length: 255 }), // Name of nearest major city (250k+ population)
  distanceToMajorCityKm: varchar("distanceToMajorCityKm", { length: 20 }), // Total driving distance to nearest major city
  
  // Additional Information
  notes: text("notes"),
  videoConferenceLink: varchar("videoConferenceLink", { length: 500 }),
  coveredByCOI: boolean("coveredByCOI").default(true),
  
  // Job Status
  status: mysqlEnum("status", [
    "pending_supplier_acceptance",  // Available for suppliers to accept
    "supplier_accepted",            // Supplier accepted, pending engineer assignment
    "sent_to_engineer",             // Sent to engineer via token link
    "engineer_accepted",            // Engineer accepted the job
    "declined",                     // Supplier or engineer declined
    "en_route",                     // Engineer traveling to site
    "on_site",                      // Engineer arrived on site
    "completed",                    // Job finished
    "cancelled"                     // Job cancelled
  ]).default("pending_supplier_acceptance").notNull(),
  
  // Engineer/Technician Information
  engineerName: varchar("engineerName", { length: 255 }),
  engineerEmail: varchar("engineerEmail", { length: 320 }),
  engineerPhone: varchar("engineerPhone", { length: 50 }),
  engineerToken: varchar("engineerToken", { length: 64 }).unique(), // Unique token for engineer access
  shortCode: varchar("shortCode", { length: 8 }).unique(), // Short code for shareable links (e.g., ABC12345)
  
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
  
  // Service Level: same_business_day, next_business_day, scheduled
  serviceLevel: mysqlEnum("serviceLevel", ["same_business_day", "next_business_day", "scheduled"]).notNull(),
  
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
    table.serviceLevel
  ),
}));

export type SupplierResponseTimeExclusion = typeof supplierResponseTimeExclusions.$inferSelect;
export type InsertSupplierResponseTimeExclusion = typeof supplierResponseTimeExclusions.$inferInsert;

/**
 * Job Status History - audit trail for status changes
 * Tracks every status transition with timestamp and optional GPS location
 */
export const jobStatusHistory = mysqlTable("jobStatusHistory", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  
  status: varchar("status", { length: 50 }).notNull(),
  notes: text("notes"),
  
  // Location at time of status change (optional)
  latitude: varchar("latitude", { length: 50 }),
  longitude: varchar("longitude", { length: 50 }),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("jobStatusHistory_jobId_idx").on(table.jobId),
}));

export type JobStatusHistory = typeof jobStatusHistory.$inferSelect;
export type InsertJobStatusHistory = typeof jobStatusHistory.$inferInsert;

/**
 * Job Locations - stores GPS tracking data
 * Tracks engineer location during travel and on-site work
 */
export const jobLocations = mysqlTable("jobLocations", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  
  // GPS Coordinates
  latitude: varchar("latitude", { length: 50 }).notNull(),
  longitude: varchar("longitude", { length: 50 }).notNull(),
  accuracy: varchar("accuracy", { length: 50 }), // in meters
  
  // Tracking context
  trackingType: mysqlEnum("trackingType", ["en_route", "on_site", "milestone"]).notNull(),
  
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  jobIdIdx: index("jobLocations_jobId_idx").on(table.jobId),
}));

export type JobLocation = typeof jobLocations.$inferSelect;
export type InsertJobLocation = typeof jobLocations.$inferInsert;

/**
 * Site Visit Reports - stores engineer completion reports
 * Includes work details, client sign-off, and digital signature
 */
export const siteVisitReports = mysqlTable("siteVisitReports", {
  id: int("id").autoincrement().primaryKey(),
  jobId: int("jobId").notNull().unique().references(() => jobs.id, { onDelete: "cascade" }),
  
  // Visit Details
  visitDate: timestamp("visitDate").notNull(),
  ticketNumbers: text("ticketNumbers"),
  engineerName: varchar("engineerName", { length: 255 }).notNull(),
  onsiteContact: varchar("onsiteContact", { length: 255 }),
  timeOnsite: varchar("timeOnsite", { length: 50 }),
  timeLeftSite: varchar("timeLeftSite", { length: 50 }),
  
  // Work Details
  issueFault: text("issueFault"),
  actionsPerformed: text("actionsPerformed"),
  recommendations: text("recommendations"),
  issueResolved: boolean("issueResolved").default(false),
  contactAgreed: boolean("contactAgreed").default(false),
  
  // Client Sign-off
  clientSignatory: varchar("clientSignatory", { length: 255 }),
  clientSignatureData: longtext("clientSignatureData"), // Base64 signature image
  signedAt: timestamp("signedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  jobIdIdx: index("siteVisitReports_jobId_idx").on(table.jobId),
}));

export type SiteVisitReport = typeof siteVisitReports.$inferSelect;
export type InsertSiteVisitReport = typeof siteVisitReports.$inferInsert;

/**
 * SVR Media Files - stores photos and videos attached to site visit reports
 */
export const svrMediaFiles = mysqlTable("svrMediaFiles", {
  id: int("id").autoincrement().primaryKey(),
  svrId: int("svrId").notNull().references(() => siteVisitReports.id, { onDelete: "cascade" }),
  
  // File Information
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // File reference key
  fileUrl: longtext("fileUrl").notNull(), // Base64 data URL for local storage
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: mysqlEnum("fileType", ["image", "video"]).notNull(),
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  svrIdIdx: index("svrMediaFiles_svrId_idx").on(table.svrId),
}));

export type SvrMediaFile = typeof svrMediaFiles.$inferSelect;
export type InsertSvrMediaFile = typeof svrMediaFiles.$inferInsert;

/**
 * Supplier Company Profile - stores detailed company information for verification
 */
export const supplierCompanyProfile = mysqlTable("supplierCompanyProfile", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }).unique(),
  
  // Company Overview
  companyName: varchar("companyName", { length: 255 }).notNull(),
  registrationNumber: varchar("registrationNumber", { length: 100 }),
  yearFounded: int("yearFounded"),
  
  // Locations
  headquarters: text("headquarters"), // Full address
  regionalOffices: json("regionalOffices").$type<Array<{city: string, country: string, address: string}>>(), // Array of office locations
  
  // Ownership
  ownershipStructure: mysqlEnum("ownershipStructure", ["private", "group", "subsidiary"]).notNull(),
  parentCompany: varchar("parentCompany", { length: 255 }), // If subsidiary
  
  // Company Description
  missionStatement: text("missionStatement"),
  coreValues: text("coreValues"),
  companyOverview: text("companyOverview"), // What the company does
  
  // Additional Info
  numberOfEmployees: int("numberOfEmployees"),
  annualRevenue: int("annualRevenue"), // in USD
  websiteUrl: varchar("websiteUrl", { length: 500 }),
  linkedInUrl: varchar("linkedInUrl", { length: 500 }),
  
  // Primary Contact
  primaryContactName: varchar("primaryContactName", { length: 255 }),
  primaryContactTitle: varchar("primaryContactTitle", { length: 255 }),
  primaryContactEmail: varchar("primaryContactEmail", { length: 320 }),
  primaryContactPhone: varchar("primaryContactPhone", { length: 50 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdIdx: index("supplierCompanyProfile_supplierId_idx").on(table.supplierId),
}));

export type SupplierCompanyProfile = typeof supplierCompanyProfile.$inferSelect;
export type InsertSupplierCompanyProfile = typeof supplierCompanyProfile.$inferInsert;

/**
 * Verification Documents - stores all uploaded documents for supplier verification
 */
export const verificationDocuments = mysqlTable("verificationDocuments", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  
  // Document Type
  documentType: mysqlEnum("documentType", [
    "insurance_liability",
    "insurance_indemnity", 
    "insurance_workers_comp",
    "dpa_signed",
    "nda_signed",
    "non_compete_signed",
    "background_verification_signed",
    "right_to_work_signed",
    "security_compliance",
    "engineer_vetting_policy",
    "other"
  ]).notNull(),
  
  // File Information
  documentName: varchar("documentName", { length: 255 }).notNull(), // Original filename
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(), // S3 URL
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  fileSize: int("fileSize").notNull(), // in bytes
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  
  // Upload Info
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
  uploadedBy: int("uploadedBy").references(() => users.id), // User who uploaded
  
  // Expiry (for insurance certificates)
  expiryDate: timestamp("expiryDate"),
  
  // Signature Information (for signed documents like DPA, NDA, non-compete)
  signedBy: varchar("signedBy", { length: 255 }), // Name of person who signed
  signatureUrl: varchar("signatureUrl", { length: 500 }), // S3 URL to signature image
  signedAt: timestamp("signedAt"), // When document was signed
  signerIpAddress: varchar("signerIpAddress", { length: 45 }), // IP address of signer (IPv6 max length)
  signerUserAgent: varchar("signerUserAgent", { length: 500 }), // Browser/device info
  
  // Review Status
  status: mysqlEnum("status", ["pending_review", "approved", "rejected", "expired"]).default("pending_review").notNull(),
  reviewedBy: int("reviewedBy").references(() => users.id), // Admin who reviewed
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"), // Admin notes on approval/rejection
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdIdx: index("verificationDocuments_supplierId_idx").on(table.supplierId),
  documentTypeIdx: index("verificationDocuments_documentType_idx").on(table.documentType),
  statusIdx: index("verificationDocuments_status_idx").on(table.status),
}));

export type VerificationDocument = typeof verificationDocuments.$inferSelect;
export type InsertVerificationDocument = typeof verificationDocuments.$inferInsert;

/**
 * Supplier Verification - tracks overall verification status and admin review
 */
export const supplierVerification = mysqlTable("supplierVerification", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull().references(() => suppliers.id, { onDelete: "cascade" }).unique(),
  
  // Verification Status
  status: mysqlEnum("status", [
    "not_started",
    "in_progress",
    "pending_review",
    "under_review",
    "approved",
    "rejected",
    "resubmission_required"
  ]).default("not_started").notNull(),
  
  // Submission
  submittedAt: timestamp("submittedAt"),
  
  // Admin Review
  reviewedBy: int("reviewedBy").references(() => users.id), // Admin who reviewed
  reviewedAt: timestamp("reviewedAt"),
  rejectionReason: text("rejectionReason"), // Why rejected
  adminNotes: text("adminNotes"), // Internal notes for admin team
  
  // Approval
  approvedAt: timestamp("approvedAt"),
  
  // Manual Verification Override
  isManuallyVerified: int("isManuallyVerified", { unsigned: true }).default(0).notNull(), // 1 = manually verified by admin, 0 = normal verification process
  manualVerificationReason: text("manualVerificationReason"), // Why admin manually verified
  manuallyVerifiedBy: varchar("manuallyVerifiedBy", { length: 320 }), // Admin email who manually verified
  manuallyVerifiedAt: timestamp("manuallyVerifiedAt"), // When manually verified
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  supplierIdIdx: index("supplierVerification_supplierId_idx").on(table.supplierId),
  statusIdx: index("supplierVerification_status_idx").on(table.status),
}));

export type SupplierVerification = typeof supplierVerification.$inferSelect;
export type InsertSupplierVerification = typeof supplierVerification.$inferInsert;

/**
 * Admin Organization - represents the Orbidut admin organization
 */
export const adminOrganization = mysqlTable("adminOrganization", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(), // e.g., "Orbidut Admin Team"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminOrganization = typeof adminOrganization.$inferSelect;
export type InsertAdminOrganization = typeof adminOrganization.$inferInsert;

/**
 * Admin Users - links users to admin organization with roles
 */
export const adminUsers = mysqlTable("adminUsers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: int("organizationId").notNull().references(() => adminOrganization.id, { onDelete: "cascade" }),
  
  // Role: owner (full access), admin (platform management), viewer (read-only)
  role: mysqlEnum("role", ["owner", "admin", "viewer"]).default("viewer").notNull(),
  
  // Permissions (JSON object for granular control)
  permissions: json("permissions").$type<{
    canApproveSuppliers?: boolean;
    canManageUsers?: boolean;
    canViewFinancials?: boolean;
    canManageJobs?: boolean;
    canManageAdmins?: boolean; // Only owners
  }>(),
  
  invitedBy: int("invitedBy").references(() => users.id), // Who invited this admin
  invitedAt: timestamp("invitedAt").defaultNow().notNull(),
  
  isActive: int("isActive", { unsigned: true }).default(1).notNull(), // 1 = active, 0 = revoked
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("adminUsers_userId_idx").on(table.userId),
  organizationIdIdx: index("adminUsers_organizationId_idx").on(table.organizationId),
  uniqueUserOrg: index("adminUsers_unique").on(table.userId, table.organizationId),
}));

export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = typeof adminUsers.$inferInsert;
