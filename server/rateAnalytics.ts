/**
 * Rate analytics and market comparison operations
 */
import { getDb } from "./db";
import { supplierRates, suppliers } from "../drizzle/schema";
import { eq, and, sql, ne, isNotNull } from "drizzle-orm";
import type { ServiceType, ServiceLevel } from "../shared/rates";

export interface MarketComparison {
  serviceType: ServiceType;
  serviceLevel: ServiceLevel;
  countryCode: string | null;
  supplierRate: number | null;
  marketAverage: number;
  marketMedian: number;
  marketMin: number;
  marketMax: number;
  sampleSize: number;
  percentDifference: number | null; // null if supplier has no rate set
  positioning: "below" | "at" | "above" | "no_rate";
}

export interface RateAnalyticsSummary {
  totalRatesSet: number;
  averagePositioning: "below" | "at" | "above" | "mixed";
  competitiveScore: number; // 0-100, higher = more competitive
  recommendations: string[];
  comparisons: MarketComparison[];
}

/**
 * Calculate market averages for rates
 */
async function getMarketAverages(
  serviceType: ServiceType,
  serviceLevel: ServiceLevel,
  countryCode?: string
): Promise<{
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Build conditions
  const conditions = [
    eq(supplierRates.serviceType, serviceType),
    eq(supplierRates.serviceLevel, serviceLevel),
    isNotNull(supplierRates.rateUsdCents),
  ];

  if (countryCode) {
    conditions.push(eq(supplierRates.countryCode, countryCode));
  }

  // Get all rates matching criteria
  const rates = await db
    .select({ rate: supplierRates.rateUsdCents })
    .from(supplierRates)
    .where(and(...conditions));

  if (rates.length === 0) {
    return { average: 0, median: 0, min: 0, max: 0, count: 0 };
  }

  const validRates = rates
    .map((r) => r.rate)
    .filter((r): r is number => r !== null)
    .sort((a, b) => a - b);

  const sum = validRates.reduce((acc, val) => acc + val, 0);
  const average = Math.round(sum / validRates.length);
  const median = validRates[Math.floor(validRates.length / 2)]!;
  const min = validRates[0]!;
  const max = validRates[validRates.length - 1]!;

  return {
    average,
    median,
    min,
    max,
    count: validRates.length,
  };
}

/**
 * Get rate analytics for a supplier
 */
export async function getSupplierRateAnalytics(
  supplierId: number,
  filters?: {
    serviceTypes?: ServiceType[];
    serviceLevels?: ServiceLevel[];
    countryCodes?: string[];
  }
): Promise<RateAnalyticsSummary> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get supplier's rates
  const supplierRatesQuery = db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.supplierId, supplierId));

  const supplierRatesData = await supplierRatesQuery;

  // Filter by criteria
  let filteredRates = supplierRatesData;

  if (filters?.serviceTypes && filters.serviceTypes.length > 0) {
    filteredRates = filteredRates.filter((r) =>
      filters.serviceTypes!.includes(r.serviceType as ServiceType)
    );
  }

  if (filters?.serviceLevels && filters.serviceLevels.length > 0) {
    filteredRates = filteredRates.filter((r) =>
      filters.serviceLevels!.includes(r.serviceLevel as ServiceLevel)
    );
  }

  if (filters?.countryCodes && filters.countryCodes.length > 0) {
    filteredRates = filteredRates.filter((r) =>
      r.countryCode ? filters.countryCodes!.includes(r.countryCode) : false
    );
  }

  // Build comparisons
  const comparisons: MarketComparison[] = [];

  for (const rate of filteredRates) {
    const marketData = await getMarketAverages(
      rate.serviceType as ServiceType,
      rate.serviceLevel as ServiceLevel,
      rate.countryCode || undefined
    );

    if (marketData.count < 2) {
      // Skip if not enough market data (need at least 2 suppliers)
      continue;
    }

    const supplierRate = rate.rateUsdCents;
    let percentDifference: number | null = null;
    let positioning: "below" | "at" | "above" | "no_rate" = "no_rate";

    if (supplierRate !== null) {
      percentDifference = ((supplierRate - marketData.average) / marketData.average) * 100;

      if (percentDifference < -5) {
        positioning = "below";
      } else if (percentDifference > 5) {
        positioning = "above";
      } else {
        positioning = "at";
      }
    }

    comparisons.push({
      serviceType: rate.serviceType as ServiceType,
      serviceLevel: rate.serviceLevel as ServiceLevel,
      countryCode: rate.countryCode,
      supplierRate,
      marketAverage: marketData.average,
      marketMedian: marketData.median,
      marketMin: marketData.min,
      marketMax: marketData.max,
      sampleSize: marketData.count,
      percentDifference,
      positioning,
    });
  }

  // Calculate summary metrics
  const totalRatesSet = comparisons.filter((c) => c.supplierRate !== null).length;
  const belowCount = comparisons.filter((c) => c.positioning === "below").length;
  const aboveCount = comparisons.filter((c) => c.positioning === "above").length;
  const atCount = comparisons.filter((c) => c.positioning === "at").length;

  let averagePositioning: "below" | "at" | "above" | "mixed" = "mixed";
  if (belowCount > aboveCount && belowCount > atCount) {
    averagePositioning = "below";
  } else if (aboveCount > belowCount && aboveCount > atCount) {
    averagePositioning = "above";
  } else if (atCount > belowCount && atCount > aboveCount) {
    averagePositioning = "at";
  }

  // Calculate competitive score (0-100)
  // Lower rates = higher score (more competitive)
  const avgPercentDiff =
    comparisons
      .filter((c) => c.percentDifference !== null)
      .reduce((sum, c) => sum + c.percentDifference!, 0) /
    (totalRatesSet || 1);

  let competitiveScore = 50; // baseline
  if (avgPercentDiff < 0) {
    // Below market = more competitive
    competitiveScore = Math.min(100, 50 + Math.abs(avgPercentDiff) * 2);
  } else {
    // Above market = less competitive
    competitiveScore = Math.max(0, 50 - avgPercentDiff * 2);
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (averagePositioning === "above") {
    recommendations.push(
      "Your rates are generally above market average. Consider reducing rates to improve competitiveness."
    );
  } else if (averagePositioning === "below") {
    recommendations.push(
      "Your rates are competitive and below market average. You may have room to increase rates while staying competitive."
    );
  } else if (averagePositioning === "at") {
    recommendations.push("Your rates are well-aligned with market averages.");
  }

  // Find specific outliers
  const highOutliers = comparisons.filter((c) => c.percentDifference && c.percentDifference > 20);
  if (highOutliers.length > 0) {
    recommendations.push(
      `${highOutliers.length} rate(s) are more than 20% above market average - consider adjusting for better competitiveness.`
    );
  }

  const lowOutliers = comparisons.filter((c) => c.percentDifference && c.percentDifference < -20);
  if (lowOutliers.length > 0) {
    recommendations.push(
      `${lowOutliers.length} rate(s) are more than 20% below market average - you may be underpricing these services.`
    );
  }

  return {
    totalRatesSet,
    averagePositioning,
    competitiveScore: Math.round(competitiveScore),
    recommendations,
    comparisons,
  };
}
