/**
 * Database operations for supplier rates
 */
import { getDb } from "./db";
import { supplierRates, type InsertSupplierRate, type SupplierRate } from "../drizzle/schema";
import { eq, and, isNull } from "drizzle-orm";
import type { ServiceLevel } from "../shared/rates";

interface RateInput {
  supplierId: number;
  countryCode?: string | null;
  cityId?: number | null;
  serviceType: string;
  serviceLevel: ServiceLevel;
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
    eq(supplierRates.serviceLevel, rate.serviceLevel),
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
      serviceLevel: rate.serviceLevel,
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
 * Get all rates for a supplier (filtered by current coverage)
 */
export async function getSupplierRates(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const { or, sql } = await import("drizzle-orm");
  const { supplierResponseTimeExclusions, supplierCoverageCountries } = await import("../drizzle/schema");
  
  // Get all rates for this supplier (no coverage filtering)
  const rates = await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));
  
  // Transform rates to include responseTimeHours for backwards compatibility
  const { SERVICE_LEVEL_TO_HOURS } = await import("../shared/rates");
  return rates.map(rate => ({
    ...rate,
    responseTimeHours: SERVICE_LEVEL_TO_HOURS[rate.serviceLevel],
  }));
}

/**
 * Check if a rate is excluded by response time exclusion rules
 */
export async function isRateExcluded(rate: SupplierRate, exclusions: any[]): Promise<boolean> {
  for (const excl of exclusions) {
    // Check if exclusion matches this rate
    const locationMatch = 
      (excl.countryCode && excl.countryCode === rate.countryCode) ||
      (excl.cityId && excl.cityId === rate.cityId);
    
    const serviceTypeMatch = excl.serviceType === rate.serviceType;
    const serviceLevelMatch = excl.serviceLevel === rate.serviceLevel;
    
    if (locationMatch && serviceTypeMatch && serviceLevelMatch) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get all missing rate slots for a supplier
 * Returns locations/services/service levels that need rates configured
 */
export async function getMissingRateSlots(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { supplierCoverageCountries, supplierPriorityCities, supplierServiceExclusions } = await import("../drizzle/schema");
  const { SERVICE_TYPES } = await import("../shared/rates");
  const { RATE_SERVICE_LEVELS } = await import("../shared/rates");
  
  // Get coverage
  const countries = await db
    .select()
    .from(supplierCoverageCountries)
    .where(eq(supplierCoverageCountries.supplierId, supplierId));
  
  const cities = await db
    .select()
    .from(supplierPriorityCities)
    .where(eq(supplierPriorityCities.supplierId, supplierId));
  
  // Get existing rates
  const rates = await getSupplierRates(supplierId);
  
  // Get service exclusions
  const serviceExclusions = await db
    .select()
    .from(supplierServiceExclusions)
    .where(eq(supplierServiceExclusions.supplierId, supplierId));
  
  // Build expected slots
  const expectedSlots: {
    locationType: "country" | "city";
    locationId: string | number;
    locationName: string;
    serviceType: string;
    serviceLevel: ServiceLevel;
  }[] = [];
  
  // For each country
  for (const country of countries) {
    for (const serviceLevel of RATE_SERVICE_LEVELS) {
      for (const serviceType of Object.values(SERVICE_TYPES)) {
        // Check if service is excluded
        const isExcluded = serviceExclusions.some(
          e => e.countryCode === country.countryCode && e.serviceType === serviceType
        );
        
        if (!isExcluded) {
          expectedSlots.push({
            locationType: "country",
            locationId: country.countryCode,
            locationName: country.countryCode,
            serviceType,
            serviceLevel: serviceLevel.value,
          });
        }
      }
    }
  }
  
  // For each city
  for (const city of cities) {
    for (const serviceLevel of RATE_SERVICE_LEVELS) {
      for (const serviceType of Object.values(SERVICE_TYPES)) {
        // Check if service is excluded
        const isExcluded = serviceExclusions.some(
          e => e.cityId === city.id && e.serviceType === serviceType
        );
        
        if (!isExcluded) {
          expectedSlots.push({
            locationType: "city",
            locationId: city.id,
            locationName: `${city.cityName}, ${city.countryCode}`,
            serviceType,
            serviceLevel: serviceLevel.value,
          });
        }
      }
    }
  }
  
  // Filter out slots that have rates
  const missingSlots = expectedSlots.filter(slot => {
    const hasRate = rates.some(r => {
      const locationMatch = 
        (slot.locationType === "country" && r.countryCode === slot.locationId) ||
        (slot.locationType === "city" && r.cityId === slot.locationId);
      
      return locationMatch && 
             r.serviceType === slot.serviceType && 
             r.serviceLevel === slot.serviceLevel &&
             r.rateUsdCents !== null &&
             r.rateUsdCents > 0;
    });
    
    return !hasRate;
  });
  
  return missingSlots;
}

/**
 * Check if a location/service/service level combination is excluded
 */
export function isSlotExcluded(
  locationId: string | number,
  isCountry: boolean,
  serviceType: string,
  serviceLevel: ServiceLevel,
  exclusions: any[]
): boolean {
  for (const excl of exclusions) {
    if (isCountry && excl.countryCode === locationId && excl.serviceType === serviceType && excl.serviceLevel === serviceLevel) return true;
    if (!isCountry && excl.cityId === locationId && excl.serviceType === serviceType && excl.serviceLevel === serviceLevel) return true;
  }
  return false;
}

/**
 * Get rate completion statistics for a supplier
 * Returns total, configured, missing, excluded counts and completion percentage
 */
export async function getRateCompletionStats(supplierId: number): Promise<{
  total: number;
  configured: number;
  missing: number;
  excluded: number;
  percentage: number;
  byServiceType: {
    serviceType: string;
    total: number;
    configured: number;
    missing: number;
    percentage: number;
  }[];
  byLocationType: {
    locationType: 'countries' | 'cities';
    total: number;
    configured: number;
    missing: number;
    percentage: number;
  }[];
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const { supplierCoverageCountries, supplierPriorityCities, supplierServiceExclusions, supplierResponseTimeExclusions } = await import("../drizzle/schema");
  const { RATE_SERVICE_LEVELS, SERVICE_TYPES, SERVICE_TYPE_LABELS } = await import("../shared/rates");
  
  // Extract service type values
  const SERVICE_TYPE_VALUES = [SERVICE_TYPES.L1_EUC, SERVICE_TYPES.L1_NETWORK, SERVICE_TYPES.SMART_HANDS];
  // Extract service level values
  const SERVICE_LEVEL_VALUES = RATE_SERVICE_LEVELS.map(sl => sl.value);
  
  // 1. Get coverage locations
  const coverageCountries = await db
    .select({ countryCode: supplierCoverageCountries.countryCode })
    .from(supplierCoverageCountries)
    .where(eq(supplierCoverageCountries.supplierId, supplierId));
  
  const coverageCities = await db
    .select({ id: supplierPriorityCities.id })
    .from(supplierPriorityCities)
    .where(eq(supplierPriorityCities.supplierId, supplierId));
  
  // 2. Get all rates for this supplier
  const allRates = await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));
  
  // 3. Get exclusions
  const serviceExclusions = await db
    .select()
    .from(supplierServiceExclusions)
    .where(eq(supplierServiceExclusions.supplierId, supplierId));
  
  const responseLevelExclusions = await db
    .select()
    .from(supplierResponseTimeExclusions)
    .where(eq(supplierResponseTimeExclusions.supplierId, supplierId));
  
  // 4. Build virtual table: all possible rate slots
  const virtualTable: Array<{
    location: { type: 'country', code: string } | { type: 'city', id: number };
    serviceType: string;
    serviceLevel: ServiceLevel;
  }> = [];
  
  // Add country slots
  for (const country of coverageCountries) {
    for (const serviceType of SERVICE_TYPE_VALUES) {
      for (const serviceLevel of SERVICE_LEVEL_VALUES) {
        virtualTable.push({
          location: { type: 'country', code: country.countryCode },
          serviceType,
          serviceLevel,
        });
      }
    }
  }
  
  // Add city slots
  for (const city of coverageCities) {
    for (const serviceType of SERVICE_TYPE_VALUES) {
      for (const serviceLevel of SERVICE_LEVEL_VALUES) {
        virtualTable.push({
          location: { type: 'city', id: city.id },
          serviceType,
          serviceLevel,
        });
      }
    }
  }
  
  // 5. Check each slot: is it excluded? does it have a rate > 0?
  let configured = 0;
  let missing = 0;
  let excluded = 0;
  
  // Track by service type
  const byServiceType = new Map<string, { total: number; configured: number; missing: number }>();
  for (const serviceType of SERVICE_TYPE_VALUES) {
    byServiceType.set(serviceType, { total: 0, configured: 0, missing: 0 });
  }
  
  // Track by location type
  const byLocationType = {
    countries: { total: 0, configured: 0, missing: 0 },
    cities: { total: 0, configured: 0, missing: 0 },
  };
  
  for (const slot of virtualTable) {
    const isCountry = slot.location.type === 'country';
    const locationId = isCountry 
      ? (slot.location as { type: 'country', code: string }).code 
      : (slot.location as { type: 'city', id: number }).id;
    
    // Check if service-level excluded
    const serviceExcluded = serviceExclusions.some(excl => {
      if (isCountry && excl.countryCode === locationId && excl.serviceType === slot.serviceType) return true;
      if (!isCountry && excl.cityId === locationId && excl.serviceType === slot.serviceType) return true;
      return false;
    });
    
    if (serviceExcluded) {
      excluded++;
      continue;
    }
    
    // Check if service-level excluded
    const responseLevelExcluded = responseLevelExclusions.some(excl => {
      if (isCountry && excl.countryCode === locationId && excl.serviceType === slot.serviceType && excl.serviceLevel === slot.serviceLevel) return true;
      if (!isCountry && excl.cityId === locationId && excl.serviceType === slot.serviceType && excl.serviceLevel === slot.serviceLevel) return true;
      return false;
    });
    
    if (responseLevelExcluded) {
      excluded++;
      continue;
    }
    
    // Find rate for this slot
    const rate = allRates.find(r => {
      if (isCountry && r.countryCode === locationId && r.serviceType === slot.serviceType && r.serviceLevel === slot.serviceLevel) return true;
      if (!isCountry && r.cityId === locationId && r.serviceType === slot.serviceType && r.serviceLevel === slot.serviceLevel) return true;
      return false;
    });
    
    // Check if rate is configured (exists and > 0)
    const isConfigured = rate && rate.rateUsdCents !== null && rate.rateUsdCents > 0;
    
    if (isConfigured) {
      configured++;
      const serviceStats = byServiceType.get(slot.serviceType);
      if (serviceStats) {
        serviceStats.configured++;
        serviceStats.total++;
      }
      if (isCountry) {
        byLocationType.countries.configured++;
        byLocationType.countries.total++;
      } else {
        byLocationType.cities.configured++;
        byLocationType.cities.total++;
      }
    } else {
      missing++;
      const serviceStats = byServiceType.get(slot.serviceType);
      if (serviceStats) {
        serviceStats.missing++;
        serviceStats.total++;
      }
      if (isCountry) {
        byLocationType.countries.missing++;
        byLocationType.countries.total++;
      } else {
        byLocationType.cities.missing++;
        byLocationType.cities.total++;
      }
    }
  }
  
  // 6. Calculate totals
  const total = configured + missing; // Excludes excluded slots
  const percentage = total > 0 ? Math.round((configured / total) * 1000) / 10 : 0;
  
  // Format service type breakdown
  const byServiceTypeArray = Array.from(byServiceType.entries()).map(([serviceType, stats]) => ({
    serviceType,
    total: stats.total,
    configured: stats.configured,
    missing: stats.missing,
    percentage: stats.total > 0 ? Math.round((stats.configured / stats.total) * 1000) / 10 : 0,
  }));
  
  // Format location type breakdown
  const byLocationTypeArray = [
    {
      locationType: 'countries' as const,
      total: byLocationType.countries.total,
      configured: byLocationType.countries.configured,
      missing: byLocationType.countries.missing,
      percentage: byLocationType.countries.total > 0 
        ? Math.round((byLocationType.countries.configured / byLocationType.countries.total) * 1000) / 10 
        : 0,
    },
    {
      locationType: 'cities' as const,
      total: byLocationType.cities.total,
      configured: byLocationType.cities.configured,
      missing: byLocationType.cities.missing,
      percentage: byLocationType.cities.total > 0 
        ? Math.round((byLocationType.cities.configured / byLocationType.cities.total) * 1000) / 10 
        : 0,
    },
  ];
  
  return {
    total,
    configured,
    missing,
    excluded,
    percentage,
    byServiceType: byServiceTypeArray,
    byLocationType: byLocationTypeArray,
  };
}
