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
    // Update existing
    await db
      .update(supplierRates)
      .set({
        rateUsdCents: rate.rateUsdCents,
        updatedAt: new Date(),
      })
      .where(eq(supplierRates.id, existing.id));
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
export async function getSupplierRates(supplierId: number): Promise<SupplierRate[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));
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
  // Get supplier's covered countries and priority cities
  const { getSupplierCountries, getSupplierPriorityCities } = await import("./db");
  const countries = await getSupplierCountries(supplierId);
  const cities = await getSupplierPriorityCities(supplierId);

  // Calculate total possible rates
  // (countries + cities) × 3 services × 5 response times
  const totalLocations = countries.length + cities.length;
  const totalPossible = totalLocations * 3 * 5;

  // Get all rates for this supplier
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const rates = await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));

  const configuredRates = rates.filter((r: SupplierRate) => r.rateUsdCents !== null);
  const configured = configuredRates.length;

  // Calculate by location type
  const countryRates = configuredRates.filter((r: SupplierRate) => r.countryCode !== null);
  const cityRates = configuredRates.filter((r: SupplierRate) => r.cityId !== null);
  
  const countryTotalPossible = countries.length * 3 * 5;
  const cityTotalPossible = cities.length * 3 * 5;

  // Calculate by service type
  const l1EucRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "l1_euc");
  const l1NetworkRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "l1_network");
  const smartHandsRates = configuredRates.filter((r: SupplierRate) => r.serviceType === "smart_hands");
  
  const serviceTotalPossible = totalLocations * 5; // Each service has 5 response times per location

  return {
    totalPossible,
    configured,
    percentage: totalPossible > 0 ? Math.round((configured / totalPossible) * 100) : 0,
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
        totalPossible: serviceTotalPossible,
        configured: l1EucRates.length,
        percentage: serviceTotalPossible > 0 ? Math.round((l1EucRates.length / serviceTotalPossible) * 100) : 0,
      },
      l1_network: {
        totalPossible: serviceTotalPossible,
        configured: l1NetworkRates.length,
        percentage: serviceTotalPossible > 0 ? Math.round((l1NetworkRates.length / serviceTotalPossible) * 100) : 0,
      },
      smart_hands: {
        totalPossible: serviceTotalPossible,
        configured: smartHandsRates.length,
        percentage: serviceTotalPossible > 0 ? Math.round((smartHandsRates.length / serviceTotalPossible) * 100) : 0,
      },
    },
  };
}

/**
 * Delete a rate
 */
export async function deleteRate(rateId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(supplierRates).where(eq(supplierRates.id, rateId));
}
