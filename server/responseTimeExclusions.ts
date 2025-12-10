import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { supplierResponseTimeExclusions } from "../drizzle/schema";

/**
 * Add a service level exclusion for a specific service/location/service level combination
 */
export async function addResponseTimeExclusion(exclusion: {
  supplierId: number;
  countryCode?: string;
  cityId?: number;
  serviceType: string;
  serviceLevel: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db.insert(supplierResponseTimeExclusions).values(exclusion).onDuplicateKeyUpdate({
    set: {
      createdAt: new Date(),
    },
  });
}

/**
 * Remove a service level exclusion for a specific service/location/service level combination
 */
export async function removeResponseTimeExclusion(exclusion: {
  supplierId: number;
  countryCode?: string;
  cityId?: number;
  serviceType: string;
  serviceLevel: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const conditions = [
    eq(supplierResponseTimeExclusions.supplierId, exclusion.supplierId),
    eq(supplierResponseTimeExclusions.serviceType, exclusion.serviceType),
    eq(supplierResponseTimeExclusions.serviceLevel, exclusion.serviceLevel as any),
  ];

  if (exclusion.countryCode) {
    conditions.push(eq(supplierResponseTimeExclusions.countryCode, exclusion.countryCode));
  }

  if (exclusion.cityId) {
    conditions.push(eq(supplierResponseTimeExclusions.cityId, exclusion.cityId));
  }

  await db.delete(supplierResponseTimeExclusions).where(and(...conditions));
}

/**
 * Get all service level exclusions for a supplier
 */
export async function getResponseTimeExclusions(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(supplierResponseTimeExclusions)
    .where(eq(supplierResponseTimeExclusions.supplierId, supplierId));
}
