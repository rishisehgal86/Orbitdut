/**
 * Bulk rate adjustment operations
 */
import { getDb } from "./db";
import { supplierRates } from "../drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import type { ServiceType, ServiceLevel } from "../shared/rates";

export interface BulkAdjustmentFilters {
  supplierId: number;
  serviceTypes?: ServiceType[];
  serviceLevels?: ServiceLevel[];
  countryCodes?: string[];
  cityIds?: number[];
}

export interface BulkAdjustmentPreview {
  id: number;
  serviceType: ServiceType;
  serviceLevel: ServiceLevel;
  countryCode: string | null;
  cityId: number | null;
  currentRateUsdCents: number;
  newRateUsdCents: number;
  changePercent: number;
}

/**
 * Preview bulk rate adjustments without applying them
 */
export async function previewBulkAdjustment(
  filters: BulkAdjustmentFilters,
  adjustmentPercent: number
): Promise<BulkAdjustmentPreview[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build where conditions
  const conditions = [eq(supplierRates.supplierId, filters.supplierId)];

  if (filters.serviceTypes && filters.serviceTypes.length > 0) {
    conditions.push(inArray(supplierRates.serviceType, filters.serviceTypes));
  }

  if (filters.serviceLevels && filters.serviceLevels.length > 0) {
    conditions.push(inArray(supplierRates.serviceLevel, filters.serviceLevels));
  }

  if (filters.countryCodes && filters.countryCodes.length > 0) {
    conditions.push(inArray(supplierRates.countryCode, filters.countryCodes));
  }

  if (filters.cityIds && filters.cityIds.length > 0) {
    conditions.push(inArray(supplierRates.cityId, filters.cityIds));
  }

  // Fetch matching rates
  const rates = await db
    .select()
    .from(supplierRates)
    .where(and(...conditions));

  // Calculate new rates
  return rates
    .filter((rate) => rate.rateUsdCents !== null)
    .map((rate) => {
      const multiplier = 1 + adjustmentPercent / 100;
      const newRateUsdCents = Math.round(rate.rateUsdCents! * multiplier);

      return {
        id: rate.id,
        serviceType: rate.serviceType as ServiceType,
        serviceLevel: rate.serviceLevel as ServiceLevel,
        countryCode: rate.countryCode,
        cityId: rate.cityId,
        currentRateUsdCents: rate.rateUsdCents!,
        newRateUsdCents,
        changePercent: adjustmentPercent,
      };
    });
}

/**
 * Apply bulk rate adjustments
 */
export async function applyBulkAdjustment(
  filters: BulkAdjustmentFilters,
  adjustmentPercent: number
): Promise<{ updatedCount: number }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get preview to know which rates to update
  const preview = await previewBulkAdjustment(filters, adjustmentPercent);

  if (preview.length === 0) {
    return { updatedCount: 0 };
  }

  // Update each rate
  for (const item of preview) {
    await db
      .update(supplierRates)
      .set({
        rateUsdCents: item.newRateUsdCents,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(supplierRates.id, item.id),
          eq(supplierRates.supplierId, filters.supplierId) // Security: ensure tenant isolation
        )
      );
  }

  return { updatedCount: preview.length };
}
