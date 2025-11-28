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
 * Get rate completion statistics
 */
export async function getRateCompletionStats(supplierId: number): Promise<{
  totalPossible: number;
  configured: number;
  percentage: number;
}> {
  // Get supplier's covered countries and priority cities
  const { getSupplierCountries, getSupplierPriorityCities } = await import("./db");
  const countries = await getSupplierCountries(supplierId);
  const cities = await getSupplierPriorityCities(supplierId);

  // Calculate total possible rates
  // (countries + cities) × 3 services × 5 response times
  const totalLocations = countries.length + cities.length;
  const totalPossible = totalLocations * 3 * 5;

  // Count configured rates (non-null rates)
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const rates = await db
    .select()
    .from(supplierRates)
    .where(
      and(
        eq(supplierRates.supplierId, supplierId),
        // Only count rates that have a value set
      )
    );

  const configured = rates.filter((r: SupplierRate) => r.rateUsdCents !== null).length;

  return {
    totalPossible,
    configured,
    percentage: totalPossible > 0 ? Math.round((configured / totalPossible) * 100) : 0,
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
