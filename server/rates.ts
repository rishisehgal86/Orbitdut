import { eq, and } from "drizzle-orm";
import { supplierRates, InsertSupplierRate } from "../drizzle/schema";
import { getDb } from "./db";

/**
 * Get all rates for a supplier
 */
export async function getSupplierRates(supplierId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));
}

/**
 * Upsert a single rate (insert or update if exists)
 */
export async function upsertRate(rate: InsertSupplierRate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if rate already exists
  const existing = await db
    .select()
    .from(supplierRates)
    .where(
      and(
        eq(supplierRates.supplierId, rate.supplierId),
        rate.countryCode
          ? eq(supplierRates.countryCode, rate.countryCode)
          : eq(supplierRates.cityId, rate.cityId!),
        eq(supplierRates.serviceType, rate.serviceType),
        eq(supplierRates.responseTimeHours, rate.responseTimeHours)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing rate
    await db
      .update(supplierRates)
      .set({
        rateUsdCents: rate.rateUsdCents,
        updatedAt: new Date(),
      })
      .where(eq(supplierRates.id, existing[0]!.id));
  } else {
    // Insert new rate
    await db.insert(supplierRates).values(rate);
  }
}

/**
 * Bulk upsert rates (for "Apply to All Locations" feature)
 */
export async function bulkUpsertRates(rates: InsertSupplierRate[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Use transaction for bulk operations
  for (const rate of rates) {
    await upsertRate(rate);
  }
}

/**
 * Delete a rate (for opt-out)
 */
export async function deleteRate(
  supplierId: number,
  countryCode: string | null,
  cityId: number | null,
  serviceType: string,
  responseTimeHours: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(supplierRates)
    .where(
      and(
        eq(supplierRates.supplierId, supplierId),
        countryCode
          ? eq(supplierRates.countryCode, countryCode)
          : eq(supplierRates.cityId, cityId!),
        eq(supplierRates.serviceType, serviceType as any),
        eq(supplierRates.responseTimeHours, responseTimeHours)
      )
    );
}

/**
 * Get rate completion statistics
 */
export async function getRateCompletionStats(supplierId: number) {
  const db = await getDb();
  if (!db) return { totalPossible: 0, configured: 0, percentage: 0 };

  // Get supplier's covered countries and cities
  const { supplierCoverageCountries, supplierPriorityCities } = await import("../drizzle/schema");
  
  const countries = await db
    .select()
    .from(supplierCoverageCountries)
    .where(eq(supplierCoverageCountries.supplierId, supplierId));

  const cities = await db
    .select()
    .from(supplierPriorityCities)
    .where(eq(supplierPriorityCities.supplierId, supplierId));

  // Calculate total possible rates
  // (countries + cities) × 3 service types × 5 response times
  const totalLocations = countries.length + cities.length;
  const totalPossible = totalLocations * 3 * 5;

  // Get configured rates count
  const configuredRates = await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));

  const configured = configuredRates.filter(r => r.rateUsdCents !== null).length;
  const percentage = totalPossible > 0 ? Math.round((configured / totalPossible) * 100) : 0;

  return {
    totalPossible,
    configured,
    percentage,
  };
}
