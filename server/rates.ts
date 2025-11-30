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
  configured: number;
  percentage: number;
  legacyRates: number;
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
  // Get supplier's covered countries and priority cities
  const { getSupplierCountries, getSupplierPriorityCities } = await import("./db");
  const countries = await getSupplierCountries(supplierId);
  const cities = await getSupplierPriorityCities(supplierId);

  // Get service exclusions and response time exclusions
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { supplierServiceExclusions, supplierResponseTimeExclusions } = await import("../drizzle/schema");
  const serviceExclusions = await db
    .select()
    .from(supplierServiceExclusions)
    .where(eq(supplierServiceExclusions.supplierId, supplierId));
  
  const responseTimeExclusions = await db
    .select()
    .from(supplierResponseTimeExclusions)
    .where(eq(supplierResponseTimeExclusions.supplierId, supplierId));

  // Calculate total possible rates accounting for BOTH exclusion types
  // Base: (countries + cities) × 3 services × 5 response times
  // Subtract: service exclusions (entire service/location combos × 5 response times)
  // Subtract: response time exclusions (individual rate slots)
  const totalLocations = countries.length + cities.length;
  const baseTotal = totalLocations * 3 * 5;
  const serviceExclusionCount = serviceExclusions.length * 5; // Each service exclusion removes 5 response times
  const responseTimeExclusionCount = responseTimeExclusions.length; // Each is one specific rate slot
  const totalPossible = baseTotal - serviceExclusionCount - responseTimeExclusionCount;

  // Get all rates for this supplier (db already initialized above)
  
  // Only count rates where service is available (isServiceable = 1 or null for legacy data)
  const { or, isNull } = await import("drizzle-orm");
  const rates = await db
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

  // Simple logic: if a rate has a price (rateUsdCents is not null), it's configured
  const configuredRates = rates.filter((r: SupplierRate) => r.rateUsdCents !== null);
  const configured = configuredRates.length;
  
  // Count legacy rates (rates without proper service type) for warning display
  const legacyRates = configuredRates.filter((r: SupplierRate) => 
    r.serviceType !== "l1_euc" && 
    r.serviceType !== "l1_network" && 
    r.serviceType !== "smart_hands"
  );

  // Calculate by location type (accounting for exclusions)
  const countryRates = configuredRates.filter((r: SupplierRate) => r.countryCode !== null);
  const cityRates = configuredRates.filter((r: SupplierRate) => r.cityId !== null);
  
  const countryExclusions = serviceExclusions.filter((e: any) => e.countryCode !== null).length;
  const cityExclusions = serviceExclusions.filter((e: any) => e.cityId !== null).length;
  
  const countryTotalPossible = (countries.length * 3 * 5) - (countryExclusions * 5);
  const cityTotalPossible = (cities.length * 3 * 5) - (cityExclusions * 5);

  // Calculate by service type (accounting for exclusions)
  const l1EucRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "l1_euc");
  const l1NetworkRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "l1_network");
  const smartHandsRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "smart_hands");
  
  // Legacy rates already counted above
  
  // Calculate total possible for each service type (accounting for exclusions)
  const l1EucExclusions = serviceExclusions.filter((e: any) => e.serviceType === "l1_euc").length;
  const l1NetworkExclusions = serviceExclusions.filter((e: any) => e.serviceType === "l1_network").length;
  const smartHandsExclusions = serviceExclusions.filter((e: any) => e.serviceType === "smart_hands").length;
  
  const l1EucTotalPossible = (totalLocations * 5) - (l1EucExclusions * 5);
  const l1NetworkTotalPossible = (totalLocations * 5) - (l1NetworkExclusions * 5);
  const smartHandsTotalPossible = (totalLocations * 5) - (smartHandsExclusions * 5);

  return {
    totalPossible,
    configured,
    percentage: totalPossible > 0 ? Math.round((configured / totalPossible) * 100) : 0,
    legacyRates: legacyRates.length,
    byLocationType: {
      countries: {
        totalPossible: countryTotalPossible,
        configured: countryRates.length,
        percentage: countryTotalPossible > 0 ? Math.round((countryRates.length / countryTotalPossible) * 100) : 0,
      },
      cities: {
        totalPossible: cityTotalPossible,
        configured: cityRates.length,
        percentage: cityTotalPossible > 0 ? Math.round((cityRates.length / cityTotalPossible) * 100) : 0,
      },
    },
    byServiceType: {
      l1_euc: {
        totalPossible: l1EucTotalPossible,
        configured: l1EucRates.length,
        percentage: l1EucTotalPossible > 0 ? Math.round((l1EucRates.length / l1EucTotalPossible) * 100) : 0,
      },
      l1_network: {
        totalPossible: l1NetworkTotalPossible,
        configured: l1NetworkRates.length,
        percentage: l1NetworkTotalPossible > 0 ? Math.round((l1NetworkRates.length / l1NetworkTotalPossible) * 100) : 0,
      },
      smart_hands: {
        totalPossible: smartHandsTotalPossible,
        configured: smartHandsRates.length,
        percentage: smartHandsTotalPossible > 0 ? Math.round((smartHandsRates.length / smartHandsTotalPossible) * 100) : 0,
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
