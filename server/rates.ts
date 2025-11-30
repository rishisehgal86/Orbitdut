/**
 * Database operations for supplier rates
 */
import { getDb } from "./db";
import { supplierRates, type InsertSupplierRate, type SupplierRate } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";

interface RateInput {
  supplierId: number;
  countryCode?: string | null;
  cityId?: number | null;
  serviceType: string;
  responseTimeHours: number;
  rateUsdCents: number | null;
}

/**
 * Upsert a single rate (insert or update if exists)
 */
export async function upsertRate(rate: RateInput): Promise<void> {
  // Find existing rate
  const conditions = [
    eq(supplierRates.supplierId, rate.supplierId),
    eq(supplierRates.serviceType, rate.serviceType),
    eq(supplierRates.responseTimeHours, rate.responseTimeHours),
  ];

  // Add location condition (country OR city)
  if (rate.countryCode) {
    conditions.push(eq(supplierRates.countryCode, rate.countryCode));
    conditions.push(isNull(supplierRates.cityId));
  } else if (rate.cityId) {
    conditions.push(eq(supplierRates.cityId, rate.cityId));
    conditions.push(isNull(supplierRates.countryCode));
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [existing] = await db
    .select()
    .from(supplierRates)
    .where(and(...conditions))
    .limit(1);

  if (existing) {
    // Update existing (with defensive tenant check)
    await db
      .update(supplierRates)
      .set({
        rateUsdCents: rate.rateUsdCents,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplierRates.id, existing.id),
          eq(supplierRates.supplierId, rate.supplierId) // Defense-in-depth: ensure tenant isolation
        )
      );
  } else {
    // Insert new
    await db.insert(supplierRates).values({
      supplierId: rate.supplierId,
      countryCode: rate.countryCode || null,
      cityId: rate.cityId || null,
      serviceType: rate.serviceType,
      responseTimeHours: rate.responseTimeHours,
      rateUsdCents: rate.rateUsdCents,
    });
  }
}

/**
 * Bulk upsert rates (for "Apply to All" functionality)
 */
export async function bulkUpsertRates(rates: RateInput[]): Promise<void> {
  for (const rate of rates) {
    await upsertRate(rate);
  }
}

/**
 * Get all rates for a supplier (filtered by current coverage)
 */
export async function getSupplierRates(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { or, sql } = await import("drizzle-orm");
  const { supplierResponseTimeExclusions, supplierCoverageCountries } = await import("../drizzle/schema");
  
  // Get current coverage for this supplier
  const coverageCountries = await db
    .select()
    .from(supplierCoverageCountries)
    .where(eq(supplierCoverageCountries.supplierId, supplierId));
  
  const coverageCountryCodes = new Set(coverageCountries.map(c => c.countryCode));
  // Note: City coverage would be added here if the table exists
  
  // Get all rates where:
  // 1. Service is available (isServiceable = 1 or null for legacy data)
  // 2. Response time is NOT excluded in supplierResponseTimeExclusions
  const allRates = await db
    .select()
    .from(supplierRates)
    .where(
      and(
        eq(supplierRates.supplierId, supplierId),
        or(
          eq(supplierRates.isServiceable, 1),
          isNull(supplierRates.isServiceable)
        )
      )
    );

  // Get all response time exclusions for this supplier
  const responseTimeExcl = await db
    .select()
    .from(supplierResponseTimeExclusions)
    .where(eq(supplierResponseTimeExclusions.supplierId, supplierId));

  // Filter rates by:
  // 1. Current coverage (country or city)
  // 2. NOT matching response time exclusions
  return allRates.filter(rate => {
    // Check if rate is for a location in current coverage
    const inCoverage = 
      (rate.countryCode && coverageCountryCodes.has(rate.countryCode));
      // TODO: Add city coverage check: || (rate.cityId && coverageCityIds.has(rate.cityId))
    
    if (!inCoverage) return false;
    
    // Check if rate matches any response time exclusion
    const isExcluded = responseTimeExcl.some(excl => {
      const locationMatch = 
        (excl.countryCode && excl.countryCode === rate.countryCode) ||
        (excl.cityId && excl.cityId === rate.cityId);
      const serviceMatch = excl.serviceType === rate.serviceType;
      const responseTimeMatch = excl.responseTimeHours === rate.responseTimeHours;
      return locationMatch && serviceMatch && responseTimeMatch;
    });
    
    return !isExcluded;
  });
}

/**
 * Get rate completion statistics (simplified - direct database counts)
 */
export async function getRateCompletionStats(supplierId: number): Promise<{
  total: number;
  configured: number;
  missing: number;
  excluded: number;
  percentage: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Simple database counts - no coverage filtering or complex calculations
  const allRates = await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));
  
  // 1. Total = all rates for this supplier
  const total = allRates.length;
  
  // 2. Configured = rates with prices
  const configured = allRates.filter((r: SupplierRate) => r.rateUsdCents !== null).length;
  
  // 3. Missing = rates without prices AND not explicitly configured (isServiceable != 1)
  const missing = allRates.filter((r: SupplierRate) => 
    r.rateUsdCents === null && r.isServiceable !== 1
  ).length;
  
  // 4. Excluded = rates marked as not serviceable
  const excluded = allRates.filter((r: SupplierRate) => r.isServiceable === 0).length;
  
  // 5. Percentage = placeholder (to be calculated later)
  const percentage = 0;
  
  return {
    total,
    configured,
    missing,
    excluded,
    percentage,
  };
}

/**
 * Delete a rate
 */
export async function deleteRate(rateId: number, supplierId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(supplierRates).where(
    and(
      eq(supplierRates.id, rateId),
      eq(supplierRates.supplierId, supplierId)
    )
  );
}
