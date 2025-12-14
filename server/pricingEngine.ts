/**
 * ORBIDUT PRICING ENGINE
 * 
 * Centralized pricing calculation module with strict business rules.
 * This is the single source of truth for all pricing calculations across the platform.
 * 
 * CRITICAL RULES:
 * 1. Platform Fee: 15% markup on all jobs (hidden from customers)
 * 2. OOH Customer Surcharge: 50% (what customers pay for out-of-hours)
 * 3. OOH Supplier Premium: 25% (what suppliers receive for out-of-hours)
 * 4. Platform OOH Margin: 25% difference (50% - 25% = additional platform revenue)
 * 5. Minimum Duration: 2 hours
 * 6. Maximum Duration: 16 hours
 * 
 * DO NOT modify these rules without executive approval.
 */

// ============================================================================
// PRICING CONSTANTS (PROTECTED - DO NOT MODIFY)
// ============================================================================

export const PRICING_RULES = {
  // Platform fee applied to all jobs (hidden from customer breakdown)
  PLATFORM_FEE_PERCENT: 15,
  
  // Out-of-hours pricing
  OOH_CUSTOMER_SURCHARGE_PERCENT: 50,  // What customers pay
  OOH_SUPPLIER_PREMIUM_PERCENT: 25,    // What suppliers receive
  
  // Duration constraints
  MIN_DURATION_HOURS: 2,
  MAX_DURATION_HOURS: 16,
  
  // Business hours (local time)
  BUSINESS_HOURS_START: 9,  // 9 AM
  BUSINESS_HOURS_END: 17,   // 5 PM
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PricingInput {
  supplierHourlyRateCents: number;
  durationMinutes: number;
  isOOH: boolean;
  // Optional: for proportional OOH calculation
  startHour?: number;  // 0-23 (e.g., 16 for 4 PM)
  startMinute?: number; // 0-59
  // Optional: remote site fee (pre-calculated)
  remoteSiteFee?: {
    customerFeeCents: number;
    supplierFeeCents: number;
    platformFeeCents: number;
    nearestMajorCity: string | null;
    distanceKm: number | null;
    billableDistanceKm: number;
  };
}

export interface PricingBreakdown {
  // Supplier receives
  supplierBaseCents: number;
  supplierOOHPremiumCents: number;
  supplierRemoteSiteFeeCents: number;
  supplierTotalCents: number;
  
  // Platform receives
  platformFeeCents: number;
  platformOOHMarginCents: number;
  platformRemoteSiteFeeCents: number;
  platformTotalCents: number;
  
  // Customer pays
  customerBaseCents: number;
  customerOOHSurchargeCents: number;
  customerRemoteSiteFeeCents: number;
  customerTotalCents: number;
  
  // Metadata
  durationHours: number;
  isOOH: boolean;
  remoteSiteInfo?: {
    nearestMajorCity: string | null;
    distanceKm: number | null;
    billableDistanceKm: number;
  };
}

export interface JobPricingResult {
  // What customer sees
  customerPriceCents: number;
  
  // What supplier receives
  supplierPayoutCents: number;
  
  // What platform earns
  platformRevenueCents: number;
  
  // Full breakdown (for internal use only)
  breakdown: PricingBreakdown;
}

// ============================================================================
// CORE PRICING CALCULATION (PROTECTED)
// ============================================================================

/**
 * Calculate job pricing with full breakdown.
 * This is the authoritative pricing calculation used throughout the platform.
 * 
 * @param input - Supplier rate, duration, and OOH status
 * @returns Complete pricing breakdown for customer, supplier, and platform
 */
export function calculateJobPricing(input: PricingInput): JobPricingResult {
  const { supplierHourlyRateCents, durationMinutes, isOOH } = input;
  
  // Validate duration
  const durationHours = durationMinutes / 60;
  if (durationHours < PRICING_RULES.MIN_DURATION_HOURS) {
    throw new Error(`Duration must be at least ${PRICING_RULES.MIN_DURATION_HOURS} hours`);
  }
  if (durationHours > PRICING_RULES.MAX_DURATION_HOURS) {
    throw new Error(`Duration cannot exceed ${PRICING_RULES.MAX_DURATION_HOURS} hours`);
  }
  
  // ========================================
  // STEP 1: Calculate supplier payout
  // ========================================
  
  // Determine how many hours are OOH vs regular
  let regularHours = durationHours;
  let oohHours = 0;
  
  if (isOOH && input.startHour !== undefined && input.startMinute !== undefined) {
    // Proportional OOH calculation
    const split = calculateOOHHours(input.startHour, input.startMinute, durationMinutes);
    regularHours = split.regularHours;
    oohHours = split.oohHours;
  } else if (isOOH) {
    // Legacy: entire job is OOH (backward compatibility)
    oohHours = durationHours;
    regularHours = 0;
  }
  
  // Base amount supplier receives (rate × regular hours)
  const supplierBaseCents = Math.round(supplierHourlyRateCents * regularHours);
  
  // OOH base amount (rate × OOH hours)
  const supplierOOHBaseCents = Math.round(supplierHourlyRateCents * oohHours);
  
  // OOH premium supplier receives (25% extra on OOH hours only)
  const supplierOOHPremiumCents = Math.round(supplierOOHBaseCents * PRICING_RULES.OOH_SUPPLIER_PREMIUM_PERCENT / 100);
  
  // Remote site fee supplier receives
  const supplierRemoteSiteFeeCents = input.remoteSiteFee?.supplierFeeCents || 0;
  
  // Total supplier payout (regular hours + OOH hours + OOH premium + remote site fee)
  const supplierTotalCents = supplierBaseCents + supplierOOHBaseCents + supplierOOHPremiumCents + supplierRemoteSiteFeeCents;
  
  // ========================================
  // STEP 2: Calculate customer price
  // ========================================
  
  // Customer base price for regular hours (supplier base + 15% platform fee)
  const customerRegularBaseCents = Math.round(supplierBaseCents * (1 + PRICING_RULES.PLATFORM_FEE_PERCENT / 100));
  
  // Customer base price for OOH hours (supplier OOH base + 15% platform fee)
  const customerOOHBaseCents = Math.round(supplierOOHBaseCents * (1 + PRICING_RULES.PLATFORM_FEE_PERCENT / 100));
  
  // Total customer base (before OOH surcharge)
  const customerBaseCents = customerRegularBaseCents + customerOOHBaseCents;
  
  // OOH surcharge customer pays (50% of OOH hours only)
  const customerOOHSurchargeCents = Math.round(supplierOOHBaseCents * PRICING_RULES.OOH_CUSTOMER_SURCHARGE_PERCENT / 100);
  
  // Remote site fee customer pays
  const customerRemoteSiteFeeCents = input.remoteSiteFee?.customerFeeCents || 0;
  
  // Total customer pays
  const customerTotalCents = customerBaseCents + customerOOHSurchargeCents + customerRemoteSiteFeeCents;
  
  // ========================================
  // STEP 3: Calculate platform revenue
  // ========================================
  
  // Platform fee (15% of supplier base for both regular and OOH hours)
  const platformFeeCents = customerBaseCents - (supplierBaseCents + supplierOOHBaseCents);
  
  // Platform OOH margin (difference between what customer pays and supplier receives)
  const platformOOHMarginCents = customerOOHSurchargeCents - supplierOOHPremiumCents;
  
  // Platform remote site fee revenue
  const platformRemoteSiteFeeCents = input.remoteSiteFee?.platformFeeCents || 0;
  
  // Total platform revenue
  const platformTotalCents = platformFeeCents + platformOOHMarginCents + platformRemoteSiteFeeCents;
  
  // ========================================
  // STEP 4: Verify accounting integrity
  // ========================================
  
  // CRITICAL: Customer payment must equal supplier payout + platform revenue
  const calculatedTotal = supplierTotalCents + platformTotalCents;
  if (Math.abs(calculatedTotal - customerTotalCents) > 1) {
    throw new Error(
      `Pricing calculation error: Customer pays ${customerTotalCents}, ` +
      `but supplier receives ${supplierTotalCents} + platform earns ${platformTotalCents} = ${calculatedTotal}`
    );
  }
  
  // ========================================
  // Return complete breakdown
  // ========================================
  
  return {
    customerPriceCents: customerTotalCents,
    supplierPayoutCents: supplierTotalCents,
    platformRevenueCents: platformTotalCents,
    breakdown: {
      supplierBaseCents,
      supplierOOHPremiumCents,
      supplierRemoteSiteFeeCents,
      supplierTotalCents,
      platformFeeCents,
      platformOOHMarginCents,
      platformRemoteSiteFeeCents,
      platformTotalCents,
      customerBaseCents,
      customerOOHSurchargeCents,
      customerRemoteSiteFeeCents,
      customerTotalCents,
      durationHours,
      isOOH,
      remoteSiteInfo: input.remoteSiteFee ? {
        nearestMajorCity: input.remoteSiteFee.nearestMajorCity,
        distanceKm: input.remoteSiteFee.distanceKm,
        billableDistanceKm: input.remoteSiteFee.billableDistanceKm,
      } : undefined,
    },
  };
}

// ============================================================================
// CUSTOMER-FACING PRICING (PUBLIC API)
// ============================================================================

/**
 * Get customer-facing price information (hides platform fee details).
 * This is what customers see on the request form and pricing pages.
 */
export interface CustomerPricingDisplay {
  totalPriceCents: number;
  breakdown: {
    basePriceCents: number;
    oohSurchargeCents: number;
    remoteSiteFeeCents: number;
    durationHours: number;
    isOOH: boolean;
    oohHours?: number;
    regularHours?: number;
    remoteSiteInfo?: {
      nearestMajorCity: string | null;
      distanceKm: number | null;
      billableDistanceKm: number;
    };
  };
}

export function getCustomerPricingDisplay(input: PricingInput): CustomerPricingDisplay {
  const result = calculateJobPricing(input);
  
  // Calculate OOH hours breakdown if applicable
  let oohHours: number | undefined;
  let regularHours: number | undefined;
  
  if (result.breakdown.isOOH && input.startHour !== undefined && input.startMinute !== undefined) {
    const split = calculateOOHHours(input.startHour, input.startMinute, input.durationMinutes);
    oohHours = split.oohHours;
    regularHours = split.regularHours;
  } else if (result.breakdown.isOOH) {
    // Legacy: entire job is OOH
    oohHours = result.breakdown.durationHours;
    regularHours = 0;
  }
  
  return {
    totalPriceCents: result.customerPriceCents,
    breakdown: {
      basePriceCents: result.breakdown.customerBaseCents,
      oohSurchargeCents: result.breakdown.customerOOHSurchargeCents,
      remoteSiteFeeCents: result.breakdown.customerRemoteSiteFeeCents,
      durationHours: result.breakdown.durationHours,
      isOOH: result.breakdown.isOOH,
      oohHours,
      regularHours,
      remoteSiteInfo: result.breakdown.remoteSiteInfo,
    },
  };
}

// ============================================================================
// SUPPLIER-FACING PRICING (PUBLIC API)
// ============================================================================

/**
 * Get supplier-facing payout information.
 * This is what suppliers see in their dashboard and job details.
 */
export interface SupplierPayoutDisplay {
  totalPayoutCents: number;
  breakdown: {
    basePayoutCents: number;
    oohPremiumCents: number;
    remoteSiteFeeCents: number;
    durationHours: number;
    isOOH: boolean;
  };
}

export function getSupplierPayoutDisplay(input: PricingInput): SupplierPayoutDisplay {
  const result = calculateJobPricing(input);
  
  // For supplier display, basePayoutCents = total before OOH premium and remote site fee
  // This is supplierTotalCents - supplierOOHPremiumCents - supplierRemoteSiteFeeCents
  const basePayoutCents = result.breakdown.supplierTotalCents - result.breakdown.supplierOOHPremiumCents - result.breakdown.supplierRemoteSiteFeeCents;
  
  return {
    totalPayoutCents: result.supplierPayoutCents,
    breakdown: {
      basePayoutCents,
      oohPremiumCents: result.breakdown.supplierOOHPremiumCents,
      remoteSiteFeeCents: result.breakdown.supplierRemoteSiteFeeCents,
      durationHours: result.breakdown.durationHours,
      isOOH: result.breakdown.isOOH,
    },
  };
}

// ============================================================================
// ADMIN-FACING PRICING (INTERNAL API)
// ============================================================================

/**
 * Get complete pricing breakdown for admin/superadmin use.
 * Shows full transparency of revenue split.
 */
export interface AdminPricingDisplay {
  customerPays: number;
  supplierReceives: number;
  platformEarns: number;
  breakdown: PricingBreakdown;
}

export function getAdminPricingDisplay(input: PricingInput): AdminPricingDisplay {
  const result = calculateJobPricing(input);
  
  return {
    customerPays: result.customerPriceCents,
    supplierReceives: result.supplierPayoutCents,
    platformEarns: result.platformRevenueCents,
    breakdown: result.breakdown,
  };
}

// ============================================================================
// MULTI-SUPPLIER PRICING (FOR ESTIMATES)
// ============================================================================

/**
 * Calculate pricing range from multiple suppliers.
 * Used on the request form to show price estimates.
 */
export interface PriceRangeEstimate {
  minPriceCents: number;
  maxPriceCents: number;
  avgPriceCents: number;
  supplierCount: number;
  breakdown: {
    durationHours: number;
    isOOH: boolean;
    oohSurchargePercent: number;
    // Detailed breakdown for display
    minBaseCents: number;  // Min base cost (without OOH/remote fee)
    maxBaseCents: number;  // Max base cost (without OOH/remote fee)
    avgBaseCents: number;  // Avg base cost (without OOH/remote fee)
    minOOHSurchargeCents: number;  // Min OOH surcharge amount
    maxOOHSurchargeCents: number;  // Max OOH surcharge amount
    avgOOHSurchargeCents: number;  // Avg OOH surcharge amount
  };
}

export function calculatePriceRange(
  supplierRatesCents: number[],
  durationMinutes: number,
  isOOH: boolean,
  startHour?: number,
  startMinute?: number,
  remoteSiteFee?: {
    customerFeeCents: number;
    supplierFeeCents: number;
    platformFeeCents: number;
    nearestMajorCity: string | null;
    distanceKm: number | null;
    billableDistanceKm: number;
  } | null
): PriceRangeEstimate {
  if (supplierRatesCents.length === 0) {
    throw new Error("At least one supplier rate is required");
  }
  
  // Calculate customer price for each supplier with detailed breakdown
  const pricingResults = supplierRatesCents.map(rate => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: rate,
      durationMinutes,
      isOOH,
      startHour,
      startMinute,
      remoteSiteFee: remoteSiteFee || undefined,
    });
    return {
      totalCents: result.customerPriceCents,
      baseCents: result.breakdown.customerBaseCents,
      oohSurchargeCents: result.breakdown.customerOOHSurchargeCents,
    };
  });
  
  const customerPrices = pricingResults.map(r => r.totalCents);
  const basePrices = pricingResults.map(r => r.baseCents);
  const oohSurcharges = pricingResults.map(r => r.oohSurchargeCents);
  
  return {
    minPriceCents: Math.min(...customerPrices),
    maxPriceCents: Math.max(...customerPrices),
    avgPriceCents: Math.round(customerPrices.reduce((a, b) => a + b, 0) / customerPrices.length),
    supplierCount: supplierRatesCents.length,
    breakdown: {
      durationHours: durationMinutes / 60,
      isOOH,
      oohSurchargePercent: isOOH ? PRICING_RULES.OOH_CUSTOMER_SURCHARGE_PERCENT : 0,
      minBaseCents: Math.min(...basePrices),
      maxBaseCents: Math.max(...basePrices),
      avgBaseCents: Math.round(basePrices.reduce((a, b) => a + b, 0) / basePrices.length),
      minOOHSurchargeCents: Math.min(...oohSurcharges),
      maxOOHSurchargeCents: Math.max(...oohSurcharges),
      avgOOHSurchargeCents: Math.round(oohSurcharges.reduce((a, b) => a + b, 0) / oohSurcharges.length),
    },
  };
}

// ============================================================================
// OOH HOURS CALCULATION
// ============================================================================

/**
 * Calculate how many hours of a job fall outside business hours (9 AM - 5 PM).
 * 
 * @param startHour - Start hour in 24-hour format (0-23)
 * @param startMinute - Start minute (0-59)
 * @param durationMinutes - Total job duration in minutes
 * @returns Object with regularHours and oohHours
 */
export function calculateOOHHours(
  startHour: number,
  startMinute: number,
  durationMinutes: number
): { regularHours: number; oohHours: number } {
  const BUSINESS_START = PRICING_RULES.BUSINESS_HOURS_START; // 9 AM
  const BUSINESS_END = PRICING_RULES.BUSINESS_HOURS_END;     // 5 PM
  
  // Convert start time to minutes since midnight
  const startMinutesSinceMidnight = startHour * 60 + startMinute;
  const endMinutesSinceMidnight = startMinutesSinceMidnight + durationMinutes;
  
  // Business hours in minutes since midnight
  const businessStartMinutes = BUSINESS_START * 60;  // 9 AM = 540 minutes
  const businessEndMinutes = BUSINESS_END * 60;      // 5 PM = 1020 minutes
  
  let regularMinutes = 0;
  let oohMinutes = 0;
  
  // Calculate overlap with business hours
  const overlapStart = Math.max(startMinutesSinceMidnight, businessStartMinutes);
  const overlapEnd = Math.min(endMinutesSinceMidnight, businessEndMinutes);
  
  if (overlapStart < overlapEnd) {
    // Some work falls within business hours
    regularMinutes = overlapEnd - overlapStart;
  }
  
  // Remaining time is OOH
  oohMinutes = durationMinutes - regularMinutes;
  
  return {
    regularHours: regularMinutes / 60,
    oohHours: oohMinutes / 60,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format cents to dollar string
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Validate duration is within allowed range
 */
export function isValidDuration(durationMinutes: number): boolean {
  const hours = durationMinutes / 60;
  return hours >= PRICING_RULES.MIN_DURATION_HOURS && hours <= PRICING_RULES.MAX_DURATION_HOURS;
}
