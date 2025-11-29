/**
 * Rate validation utilities for detecting illogical pricing patterns
 */

import { RESPONSE_TIME_HOURS } from "./rates";

export interface RateWarning {
  type: "inverted_pricing" | "large_gap" | "missing_rate";
  message: string;
  severity: "warning" | "info";
  affectedResponseTimes: number[];
}

export interface RateSet {
  [responseTimeHours: number]: number | null | undefined;
}

/**
 * Validate a set of rates for a single service type and location
 * Returns array of warnings if any issues are found
 */
export function validateRates(rates: RateSet): RateWarning[] {
  const warnings: RateWarning[] = [];
  
  // Convert rates object to sorted array by response time
  const sortedRates = RESPONSE_TIME_HOURS.map((rt: number) => ({
    responseTime: rt,
    rate: rates[rt],
  })).filter(r => r.rate !== null && r.rate !== undefined && r.rate > 0);
  
  if (sortedRates.length === 0) {
    return warnings;
  }
  
  // Check for inverted pricing (faster response time more expensive than slower)
  for (let i = 0; i < sortedRates.length - 1; i++) {
    const current = sortedRates[i]!;
    const next = sortedRates[i + 1]!;
    
    // Faster response time (smaller number) should cost more (or equal)
    if (current.rate! < next.rate!) {
      warnings.push({
        type: "inverted_pricing",
        message: `${current.responseTime}h rate ($${(current.rate! / 100).toFixed(2)}) is lower than ${next.responseTime}h rate ($${(next.rate! / 100).toFixed(2)}). Faster response times should typically cost more.`,
        severity: "warning",
        affectedResponseTimes: [current.responseTime, next.responseTime],
      });
    }
  }
  
  // Check for large gaps between adjacent tiers (>50% increase)
  for (let i = 0; i < sortedRates.length - 1; i++) {
    const current = sortedRates[i]!;
    const next = sortedRates[i + 1]!;
    
    const percentDecrease = ((current.rate! - next.rate!) / current.rate!) * 100;
    
    if (percentDecrease > 50) {
      warnings.push({
        type: "large_gap",
        message: `Large price drop (${percentDecrease.toFixed(0)}%) from ${current.responseTime}h to ${next.responseTime}h. Consider more gradual pricing tiers.`,
        severity: "info",
        affectedResponseTimes: [current.responseTime, next.responseTime],
      });
    }
  }
  
  return warnings;
}

/**
 * Validate rates in Quick Setup base rate inputs
 */
export function validateBaseRates(baseRates: { [key: number]: string }): RateWarning[] {
  const rateSet: RateSet = {};
  
  RESPONSE_TIME_HOURS.forEach((rt: number) => {
    const value = baseRates[rt];
    if (value && value.trim() !== "") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 0) {
        rateSet[rt] = Math.round(numValue * 100); // Convert to cents
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
