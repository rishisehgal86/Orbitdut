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
  
  const { supplierCoverageCountries, supplierPriorityCities } = await import("../drizzle/schema");
  const { sql } = await import("drizzle-orm");
  
  // 1. Get coverage locations
  const coverageCountries = await db
    .select({ countryCode: supplierCoverageCountries.countryCode })
    .from(supplierCoverageCountries)
    .where(eq(supplierCoverageCountries.supplierId, supplierId));
  
  const coverageCities = await db
    .select({ id: supplierPriorityCities.id })
    .from(supplierPriorityCities)
    .where(eq(supplierPriorityCities.supplierId, supplierId));
  
  // 2. Get all rates for this supplier
  const allRates = await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));
  
  // 3. Get exclusions
  const { supplierServiceExclusions, supplierResponseTimeExclusions } = await import("../drizzle/schema");
  
  const serviceExclusions = await db
    .select()
    .from(supplierServiceExclusions)
    .where(eq(supplierServiceExclusions.supplierId, supplierId));
  
  const responseTimeExclusions = await db
    .select()
    .from(supplierResponseTimeExclusions)
    .where(eq(supplierResponseTimeExclusions.supplierId, supplierId));
  
  // 4. Build virtual table: all possible rate slots with their data
  const SERVICE_TYPES = ['L1 End User Computing', 'L1 Network Support', 'Smart Hands'];
  const RESPONSE_TIMES = [4, 24, 48];
  
  const virtualTable: Array<{
    location: { type: 'country', code: string } | { type: 'city', id: number };
    serviceType: string;
    responseTimeHours: number;
    rate: typeof allRates[0] | undefined;
  }> = [];
  
  // Add country slots
  for (const country of coverageCountries) {
    for (const serviceType of SERVICE_TYPES) {
      for (const responseTimeHours of RESPONSE_TIMES) {
        // Find matching rate from database
        const rate = allRates.find(r => 
          r.countryCode === country.countryCode && 
          r.serviceType === serviceType && 
          r.responseTimeHours === responseTimeHours
        );
        
        virtualTable.push({
          location: { type: 'country', code: country.countryCode },
          serviceType,
          responseTimeHours,
          rate,
        });
      }
    }
  }
  
  // Add city slots
  for (const city of coverageCities) {
    for (const serviceType of SERVICE_TYPES) {
      for (const responseTimeHours of RESPONSE_TIMES) {
        // Find matching rate from database
        const rate = allRates.find(r => 
          r.cityId === city.id && 
          r.serviceType === serviceType && 
          r.responseTimeHours === responseTimeHours
        );
        
        virtualTable.push({
          location: { type: 'city', id: city.id },
          serviceType,
          responseTimeHours,
          rate,
        });
      }
    }
  }
  
  // 5. Check each slot: is it excluded? does it have a rate > 0?
  let configured = 0;
  let missing = 0;
  let excluded = 0;
  
  for (const slot of virtualTable) {
    const isCountry = slot.location.type === 'country';
    const locationId = isCountry 
      ? (slot.location as { type: 'country', code: string }).code 
      : (slot.location as { type: 'city', id: number }).id;
    
    // Check if service-level excluded
    const serviceExcluded = serviceExclusions.some(excl => {
      if (isCountry && excl.countryCode === locationId && excl.serviceType === slot.serviceType) return true;
      if (!isCountry && excl.cityId === locationId && excl.serviceType === slot.serviceType) return true;
      return false;
    });
    
    if (serviceExcluded) {
      excluded++;
      continue;
    }
    
    // Check if response-time-level excluded
    const responseTimeExcluded = responseTimeExclusions.some(excl => {
      if (isCountry && excl.countryCode === locationId && excl.serviceType === slot.serviceType && excl.responseTimeHours === slot.responseTimeHours) return true;
      if (!isCountry && excl.cityId === locationId && excl.serviceType === slot.serviceType && excl.responseTimeHours === slot.responseTimeHours) return true;
      return false;
    });
    
    if (responseTimeExcluded) {
      excluded++;
      continue;
    }
    
    // Check if rate is configured (exists and > 0)
    if (slot.rate && slot.rate.rateUsdCents !== null && slot.rate.rateUsdCents > 0) {
      configured++;
    } else {
      missing++;
    }
  }
  
  // 6. Calculate totals
  const total = configured + missing; // Excludes excluded slots
  const percentage = total > 0 ? Math.round((configured / total) * 1000) / 10 : 0;
  
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

/**
 * Clean up orphaned rates - rates that exist in the database but are no longer in coverage
 * or have been excluded. Returns the number of rates deleted.
 */
export async function cleanupOrphanedRates(supplierId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { supplierCoverageCountries, supplierPriorityCities } = await import("../drizzle/schema");
  const { sql } = await import("drizzle-orm");
  
  // Get current coverage
  const coverageCountries = await db
    .select({ countryCode: supplierCoverageCountries.countryCode })
    .from(supplierCoverageCountries)
    .where(eq(supplierCoverageCountries.supplierId, supplierId));
  
  const coverageCities = await db
    .select({ cityId: supplierPriorityCities.id })
    .from(supplierPriorityCities)
    .where(eq(supplierPriorityCities.supplierId, supplierId));
  
  const coverageCountryCodes = new Set(coverageCountries.map(c => c.countryCode));
  const coverageCityIds = new Set(coverageCities.map(c => c.cityId));
  
  // Get all rates for this supplier
  const allRates = await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));
  
  // Find orphaned rates (not in current coverage)
  const orphanedRateIds: number[] = [];
  
  for (const rate of allRates) {
    const isOrphaned = 
      (rate.countryCode && !coverageCountryCodes.has(rate.countryCode)) ||
      (rate.cityId && !coverageCityIds.has(rate.cityId));
    
    if (isOrphaned && rate.id) {
      orphanedRateIds.push(rate.id);
    }
  }
  
  // Delete orphaned rates in batches
  if (orphanedRateIds.length > 0) {
    // Delete in batches of 100 to avoid SQL query limits
    for (let i = 0; i < orphanedRateIds.length; i += 100) {
      const batch = orphanedRateIds.slice(i, i + 100);
      await db
        .delete(supplierRates)
        .where(
          and(
            eq(supplierRates.supplierId, supplierId),
            sql`${supplierRates.id} IN (${sql.join(batch.map(id => sql`${id}`), sql`, `)})`
          )
        );
    }
  }
  
  return orphanedRateIds.length;
}
