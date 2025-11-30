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
 * Get all rates for a supplier
 */
export async function getSupplierRates(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { or, sql } = await import("drizzle-orm");
  const { supplierResponseTimeExclusions } = await import("../drizzle/schema");
  
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

  // Filter out rates that match response time exclusions
  return allRates.filter(rate => {
    return !responseTimeExcl.some(excl => {
      // Match on location (country or city)
      const locationMatch = 
        (excl.countryCode && excl.countryCode === rate.countryCode) ||
        (excl.cityId && excl.cityId === rate.cityId);
      
      // Match on service type and response time
      const serviceMatch = excl.serviceType === rate.serviceType;
      const responseTimeMatch = excl.responseTimeHours === rate.responseTimeHours;
      
      return locationMatch && serviceMatch && responseTimeMatch;
    });
  });
}

/**
 * Get rate completion statistics with detailed breakdown
 */
export async function getRateCompletionStats(supplierId: number): Promise<{
  totalPossible: number;
  exclusions: number;
  configured: number;
  missing: number;
  percentage: number;
  byLocationType: {
    countries: { totalPossible: number; configured: number; percentage: number };
    cities: { totalPossible: number; configured: number; percentage: number };
  };
  byServiceType: {
    l1_euc: { totalPossible: number; configured: number; percentage: number };
    l1_network: { totalPossible: number; configured: number; percentage: number };
    smart_hands: { totalPossible: number; configured: number; percentage: number };
  };
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { supplierCoverageCountries, supplierPriorityCities, supplierServiceExclusions, supplierResponseTimeExclusions } = await import("../drizzle/schema");
  const { sql } = await import("drizzle-orm");
  
  // 1. Calculate Total Rates from coverage: (Countries + Cities) × 3 services × 5 response times
  const [countryData] = await db
    .select({ count: sql<number>`COUNT(DISTINCT \`countryCode\`)` })
    .from(supplierCoverageCountries)
    .where(eq(supplierCoverageCountries.supplierId, supplierId));
  
  const [cityData] = await db
    .select({ count: sql<number>`COUNT(DISTINCT \`id\`)` })
    .from(supplierPriorityCities)
    .where(eq(supplierPriorityCities.supplierId, supplierId));
  
  const locationCount = (Number(countryData?.count) || 0) + (Number(cityData?.count) || 0);
  const totalPossible = locationCount * 3 * 5; // 3 services × 5 response times
  
  // 2. Count Exclusions from both exclusion tables
  const [serviceExclusionCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(supplierServiceExclusions)
    .where(eq(supplierServiceExclusions.supplierId, supplierId));
  
  const [responseTimeExclusionCount] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(supplierResponseTimeExclusions)
    .where(eq(supplierResponseTimeExclusions.supplierId, supplierId));
  
  // Service exclusions remove 5 slots each (all response times for that service/location)
  // Response time exclusions remove 1 slot each (specific service/location/response time)
  const exclusions = (Number(serviceExclusionCount?.count) || 0) * 5 + (Number(responseTimeExclusionCount?.count) || 0);
  
  // 3. Get all ACTIVE (non-excluded) rates from database
  const activeRates = await db
    .select()
    .from(supplierRates)
    .where(
      and(
        eq(supplierRates.supplierId, supplierId),
        eq(supplierRates.isServiceable, 1)
      )
    );
  
  // 4. Configured = active rates with prices
  const configuredRates = activeRates.filter((r: SupplierRate) => r.rateUsdCents !== null);
  const configured = configuredRates.length;
  
  // 5. Missing = active rates without prices
  const missing = activeRates.filter((r: SupplierRate) => r.rateUsdCents === null).length;

  // Calculate by location type using active rates
  const countryActiveRates = activeRates.filter((r: SupplierRate) => r.countryCode !== null);
  const cityActiveRates = activeRates.filter((r: SupplierRate) => r.cityId !== null);
  
  const countryConfiguredRates = configuredRates.filter((r: SupplierRate) => r.countryCode !== null);
  const cityConfiguredRates = configuredRates.filter((r: SupplierRate) => r.cityId !== null);
  
  const countryTotalPossible = countryActiveRates.length;
  const cityTotalPossible = cityActiveRates.length;

  // Calculate by service type using active rates
  const l1EucActiveRates = activeRates.filter((r: SupplierRate) => r.serviceType === "L1_EUC");
  const l1NetworkActiveRates = activeRates.filter((r: SupplierRate) => r.serviceType === "L1_NETWORK");
  const smartHandsActiveRates = activeRates.filter((r: SupplierRate) => r.serviceType === "SMART_HANDS");
  
  const l1EucConfiguredRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "L1_EUC");
  const l1NetworkConfiguredRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "L1_NETWORK");
  const smartHandsConfiguredRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "SMART_HANDS");
  
  const l1EucTotalPossible = l1EucActiveRates.length;
  const l1NetworkTotalPossible = l1NetworkActiveRates.length;
  const smartHandsTotalPossible = smartHandsActiveRates.length;

  // 6. Completion % = Configured / (Total - Exclusions)
  const effectiveTotal = totalPossible - exclusions;
  const percentage = effectiveTotal > 0 ? Math.round((configured / effectiveTotal) * 100) : 0;
  
  return {
    totalPossible,
    exclusions,
    configured,
    missing,
    percentage,
    byLocationType: {
      countries: {
        totalPossible: countryTotalPossible,
        configured: countryConfiguredRates.length,
        percentage: countryTotalPossible > 0 ? Math.round((countryConfiguredRates.length / countryTotalPossible) * 100) : 0,
      },
      cities: {
        totalPossible: cityTotalPossible,
        configured: cityConfiguredRates.length,
        percentage: cityTotalPossible > 0 ? Math.round((cityConfiguredRates.length / cityTotalPossible) * 100) : 0,
      },
    },
    byServiceType: {
      l1_euc: {
        totalPossible: l1EucTotalPossible,
        configured: l1EucConfiguredRates.length,
        percentage: l1EucTotalPossible > 0 ? Math.round((l1EucConfiguredRates.length / l1EucTotalPossible) * 100) : 0,
      },
      l1_network: {
        totalPossible: l1NetworkTotalPossible,
        configured: l1NetworkConfiguredRates.length,
        percentage: l1NetworkTotalPossible > 0 ? Math.round((l1NetworkConfiguredRates.length / l1NetworkTotalPossible) * 100) : 0,
      },
      smart_hands: {
        totalPossible: smartHandsTotalPossible,
        configured: smartHandsConfiguredRates.length,
        percentage: smartHandsTotalPossible > 0 ? Math.round((smartHandsConfiguredRates.length / smartHandsTotalPossible) * 100) : 0,
      },
    },
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
