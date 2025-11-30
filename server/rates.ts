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
  // Simple database-driven calculation
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { or, isNull } = await import("drizzle-orm");
  
  // Get all serviceable rates for this supplier (isServiceable = 1 or null)
  // This automatically excludes both service and response time exclusions
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

  // Only count rates with valid service types (uppercase)
  const serviceableRates = allRates.filter((r: SupplierRate) => 
    r.serviceType === "L1_EUC" || r.serviceType === "L1_NETWORK" || r.serviceType === "SMART_HANDS"
  );
  
  // Total = all serviceable rate slots in database
  const totalPossible = serviceableRates.length;
  
  // Configured = serviceable rates with prices filled in
  const configuredRates = serviceableRates.filter((r: SupplierRate) => r.rateUsdCents !== null);
  const configured = configuredRates.length;

  // Calculate by location type - simple database counts
  const countryServiceableRates = serviceableRates.filter((r: SupplierRate) => r.countryCode !== null);
  const cityServiceableRates = serviceableRates.filter((r: SupplierRate) => r.cityId !== null);
  
  const countryConfiguredRates = configuredRates.filter((r: SupplierRate) => r.countryCode !== null);
  const cityConfiguredRates = configuredRates.filter((r: SupplierRate) => r.cityId !== null);
  
  const countryTotalPossible = countryServiceableRates.length;
  const cityTotalPossible = cityServiceableRates.length;

  // Calculate by service type - simple database counts (uppercase)
  const l1EucServiceableRates = serviceableRates.filter((r: SupplierRate) => r.serviceType === "L1_EUC");
  const l1NetworkServiceableRates = serviceableRates.filter((r: SupplierRate) => r.serviceType === "L1_NETWORK");
  const smartHandsServiceableRates = serviceableRates.filter((r: SupplierRate) => r.serviceType === "SMART_HANDS");
  
  const l1EucConfiguredRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "L1_EUC");
  const l1NetworkConfiguredRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "L1_NETWORK");
  const smartHandsConfiguredRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "SMART_HANDS");
  
  const l1EucTotalPossible = l1EucServiceableRates.length;
  const l1NetworkTotalPossible = l1NetworkServiceableRates.length;
  const smartHandsTotalPossible = smartHandsServiceableRates.length;

  return {
    totalPossible,
    configured,
    percentage: totalPossible > 0 ? Math.round((configured / totalPossible) * 100) : 0,
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
