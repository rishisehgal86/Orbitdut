/**
 * Rate configuration statistics for dashboard
 */
import { getDb } from "./db";
import { supplierRates, supplierCoverageCountries } from "../drizzle/schema";
import { eq, sql, and, isNotNull } from "drizzle-orm";

export interface RateConfigurationSummary {
  totalConfigured: number;
  totalPossible: number;
  configurationPercentage: number;
  byServiceType: {
    serviceType: string;
    configured: number;
    possible: number;
    percentage: number;
  }[];
  byLocation: {
    countries: number;
    cities: number;
  };
}

/**
 * Get rate configuration summary for a supplier
 */
export async function getRateConfigurationSummary(supplierId: number): Promise<RateConfigurationSummary> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all configured rates
  const configuredRates = await db
    .select()
    .from(supplierRates)
    .where(and(
      eq(supplierRates.supplierId, supplierId),
      isNotNull(supplierRates.rateUsdCents)
    ));

  // Get coverage (countries only - cities are handled within country rates)
  const countries = await db
    .select()
    .from(supplierCoverageCountries)
    .where(eq(supplierCoverageCountries.supplierId, supplierId));

  const totalLocations = countries.length;
  
  // Calculate possible rates: 3 service types × 3 service levels × locations
  const SERVICE_TYPES = ['L1_EUC', 'L1_NETWORK', 'SMART_HANDS'];
  const SERVICE_LEVELS = 3; // same_business_day, next_business_day, scheduled
  const totalPossible = totalLocations * SERVICE_TYPES.length * SERVICE_LEVELS;

  // Count by service type
  const byServiceType = SERVICE_TYPES.map(serviceType => {
    const configured = configuredRates.filter(r => r.serviceType === serviceType).length;
    const possible = totalLocations * SERVICE_LEVELS;
    return {
      serviceType,
      configured,
      possible,
      percentage: possible > 0 ? Math.round((configured / possible) * 100) : 0
    };
  });

  return {
    totalConfigured: configuredRates.length,
    totalPossible,
    configurationPercentage: totalPossible > 0 ? Math.round((configuredRates.length / totalPossible) * 100) : 0,
    byServiceType,
    byLocation: {
      countries: countries.length,
      cities: 0 // City-level rates are optional within countries
    }
  };
}
