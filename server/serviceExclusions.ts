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
