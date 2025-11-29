import { getDb } from "./db";
import { supplierServiceExclusions } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function getServiceExclusions(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db
    .select()
    .from(supplierServiceExclusions)
    .where(eq(supplierServiceExclusions.supplierId, supplierId));
}

export async function addServiceExclusion(exclusion: {
  supplierId: number;
  countryCode?: string | null;
  cityId?: number | null;
  serviceType: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db
    .insert(supplierServiceExclusions)
    .values(exclusion)
    .$returningId();
  
  return result.id;
}

export async function removeServiceExclusion(id: number, supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Defensive: ensure supplier can only delete their own exclusions
  await db
    .delete(supplierServiceExclusions)
    .where(
      and(
        eq(supplierServiceExclusions.id, id),
        eq(supplierServiceExclusions.supplierId, supplierId)
      )
    );
}

export async function bulkAddServiceExclusions(exclusions: Array<{
  supplierId: number;
  countryCode?: string | null;
  cityId?: number | null;
  serviceType: string;
}>) {
  if (exclusions.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .insert(supplierServiceExclusions)
    .values(exclusions)
    .onDuplicateKeyUpdate({
      set: {
        createdAt: new Date(),
      },
    });
}

export async function bulkRemoveServiceExclusions(
  supplierId: number,
  filters: {
    countryCode?: string;
    cityId?: number;
    serviceType?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const conditions = [eq(supplierServiceExclusions.supplierId, supplierId)];
  
  if (filters.countryCode) {
    conditions.push(eq(supplierServiceExclusions.countryCode, filters.countryCode));
  }
  if (filters.cityId) {
    conditions.push(eq(supplierServiceExclusions.cityId, filters.cityId));
  }
  if (filters.serviceType) {
    conditions.push(eq(supplierServiceExclusions.serviceType, filters.serviceType));
  }
  
  await db
    .delete(supplierServiceExclusions)
    .where(and(...conditions));
}

/**
 * Sync supplierRates.isServiceable field based on service exclusions
 * Called after service availability changes
 */
export async function syncRatesWithAvailability(
  supplierId: number,
  location: { countryCode?: string | null; cityId?: number | null },
  serviceType: string,
  isAvailable: boolean
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { supplierRates } = await import("../drizzle/schema");
  const { and, eq, isNull } = await import("drizzle-orm");
  
  const conditions = [
    eq(supplierRates.supplierId, supplierId),
    eq(supplierRates.serviceType, serviceType),
  ];
  
  // Match location: either countryCode or cityId
  if (location.countryCode) {
    conditions.push(eq(supplierRates.countryCode, location.countryCode));
    conditions.push(isNull(supplierRates.cityId));
  } else if (location.cityId) {
    conditions.push(eq(supplierRates.cityId, location.cityId));
    conditions.push(isNull(supplierRates.countryCode));
  }
  
  // Update isServiceable: 1 = available, 0 = not available
  await db
    .update(supplierRates)
    .set({ isServiceable: isAvailable ? 1 : 0 })
    .where(and(...conditions));
}

/**
 * Bulk sync all rates for a supplier based on current service exclusions
 * Useful for initial setup or fixing inconsistencies
 */
export async function bulkSyncAllRatesWithAvailability(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { supplierRates } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  // Step 1: Set all rates to available (isServiceable = 1) by default
  await db
    .update(supplierRates)
    .set({ isServiceable: 1 })
    .where(eq(supplierRates.supplierId, supplierId));
  
  // Step 2: Get all service exclusions for this supplier
  const exclusions = await getServiceExclusions(supplierId);
  
  // Step 3: For each exclusion, set matching rates to unavailable (isServiceable = 0)
  for (const exclusion of exclusions) {
    await syncRatesWithAvailability(
      supplierId,
      { countryCode: exclusion.countryCode, cityId: exclusion.cityId },
      exclusion.serviceType,
      false // not available
    );
  }
}
