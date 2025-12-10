/**
 * Rate validation utilities for detecting illogical pricing patterns
 */

import { RATE_SERVICE_LEVELS } from "./rates";

export interface RateWarning {
  type: "inverted_pricing" | "large_gap" | "missing_rate";
  message: string;
  severity: "warning" | "info";
  affectedServiceLevels: string[];
}

export interface RateSet {
  [serviceLevel: string]: number | null | undefined;
}

/**
 * Validate a set of rates for a single service type and location
 * Returns array of warnings if any issues are found
 */
export function validateRates(rates: RateSet): RateWarning[] {
  const warnings: RateWarning[] = [];
  
  // Convert rates object to array with service levels
  const sortedRates = RATE_SERVICE_LEVELS.map((sl) => ({
    serviceLevel: sl.value,
    label: sl.label,
    rate: rates[sl.value],
  })).filter(r => r.rate !== null && r.rate !== undefined && r.rate > 0);
  
  if (sortedRates.length === 0) {
    return warnings;
  }
  
  // Check for inverted pricing (higher priority should cost more)
  for (let i = 0; i < sortedRates.length - 1; i++) {
    const current = sortedRates[i]!;
    const next = sortedRates[i + 1]!;
    
    // Higher priority (earlier in list) should cost more (or equal)
    if (current.rate! < next.rate!) {
      warnings.push({
        type: "inverted_pricing",
        message: `${current.label} rate ($${(current.rate! / 100).toFixed(2)}) is lower than ${next.label} rate ($${(next.rate! / 100).toFixed(2)}). Higher priority service levels should typically cost more.`,
        severity: "warning",
        affectedServiceLevels: [current.serviceLevel, next.serviceLevel],
      });
    }
  }
  
  // Check for large gaps between adjacent tiers (>50% decrease)
  for (let i = 0; i < sortedRates.length - 1; i++) {
    const current = sortedRates[i]!;
    const next = sortedRates[i + 1]!;
    
    const percentDecrease = ((current.rate! - next.rate!) / current.rate!) * 100;
    
    if (percentDecrease > 50) {
      warnings.push({
        type: "large_gap",
        message: `Large price drop (${percentDecrease.toFixed(0)}%) from ${current.label} to ${next.label}. Consider more gradual pricing tiers.`,
        severity: "info",
        affectedServiceLevels: [current.serviceLevel, next.serviceLevel],
      });
    }
  }
  
  return warnings;
}

/**
 * Validate rates in Quick Setup base rate inputs
 */
export function validateBaseRates(baseRates: { [key: string]: string }): RateWarning[] {
  const rateSet: RateSet = {};
  
  RATE_SERVICE_LEVELS.forEach((sl) => {
    const value = baseRates[sl.value];
    if (value && value.trim() !== "") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        rateSet[sl.value] = Math.round(numValue * 100); // Convert to cents
      }
    }
  });
  
  return validateRates(rateSet);
}

/**
 * Get a user-friendly summary of warnings
 */
export function getWarningsSummary(warnings: RateWarning[]): string {
  if (warnings.length === 0) return "";
  
  const warningCount = warnings.filter(w => w.severity === "warning").length;
  const infoCount = warnings.filter(w => w.severity === "info").length;
  
  const parts: string[] = [];
  if (warningCount > 0) {
    parts.push(`${warningCount} pricing ${warningCount === 1 ? "issue" : "issues"}`);
  }
  if (infoCount > 0) {
    parts.push(`${infoCount} ${infoCount === 1 ? "suggestion" : "suggestions"}`);
  }
  
  return parts.join(", ");
}
