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
}

export interface PricingBreakdown {
  // Supplier receives
  supplierBaseCents: number;
  supplierOOHPremiumCents: number;
  supplierTotalCents: number;
  
  // Platform receives
  platformFeeCents: number;
  platformOOHMarginCents: number;
  platformTotalCents: number;
  
  // Customer pays
  customerBaseCents: number;
  customerOOHSurchargeCents: number;
  customerTotalCents: number;
  
  // Metadata
  durationHours: number;
  isOOH: boolean;
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
  
  // Base amount supplier receives (rate × duration)
  const supplierBaseCents = Math.round(supplierHourlyRateCents * durationHours);
  
  // OOH premium supplier receives (25% extra)
  const supplierOOHPremiumCents = isOOH 
    ? Math.round(supplierBaseCents * PRICING_RULES.OOH_SUPPLIER_PREMIUM_PERCENT / 100)
    : 0;
  
  // Total supplier payout
  const supplierTotalCents = supplierBaseCents + supplierOOHPremiumCents;
  
  // ========================================
  // STEP 2: Calculate customer price
  // ========================================
  
  // Customer base price (supplier base + 15% platform fee)
  const customerBaseCents = Math.round(supplierBaseCents * (1 + PRICING_RULES.PLATFORM_FEE_PERCENT / 100));
  
  // OOH surcharge customer pays (50% of base)
  const customerOOHSurchargeCents = isOOH
    ? Math.round(supplierBaseCents * PRICING_RULES.OOH_CUSTOMER_SURCHARGE_PERCENT / 100)
    : 0;
  
  // Total customer pays
  const customerTotalCents = customerBaseCents + customerOOHSurchargeCents;
  
  // ========================================
  // STEP 3: Calculate platform revenue
  // ========================================
  
  // Platform fee (15% of supplier base)
  const platformFeeCents = customerBaseCents - supplierBaseCents;
  
  // Platform OOH margin (difference between what customer pays and supplier receives)
  const platformOOHMarginCents = customerOOHSurchargeCents - supplierOOHPremiumCents;
  
  // Total platform revenue
  const platformTotalCents = platformFeeCents + platformOOHMarginCents;
  
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
      supplierTotalCents,
      platformFeeCents,
      platformOOHMarginCents,
      platformTotalCents,
      customerBaseCents,
      customerOOHSurchargeCents,
      customerTotalCents,
      durationHours,
      isOOH,
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
    durationHours: number;
    isOOH: boolean;
  };
}

export function getCustomerPricingDisplay(input: PricingInput): CustomerPricingDisplay {
  const result = calculateJobPricing(input);
  
  return {
    totalPriceCents: result.customerPriceCents,
    breakdown: {
      basePriceCents: result.breakdown.customerBaseCents,
      oohSurchargeCents: result.breakdown.customerOOHSurchargeCents,
      durationHours: result.breakdown.durationHours,
      isOOH: result.breakdown.isOOH,
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
    durationHours: number;
    isOOH: boolean;
  };
}

export function getSupplierPayoutDisplay(input: PricingInput): SupplierPayoutDisplay {
  const result = calculateJobPricing(input);
  
  return {
    totalPayoutCents: result.supplierPayoutCents,
    breakdown: {
      basePayoutCents: result.breakdown.supplierBaseCents,
      oohPremiumCents: result.breakdown.supplierOOHPremiumCents,
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
  };
}

export function calculatePriceRange(
  supplierRatesCents: number[],
  durationMinutes: number,
  isOOH: boolean
): PriceRangeEstimate {
  if (supplierRatesCents.length === 0) {
    throw new Error("At least one supplier rate is required");
  }
  
  // Calculate customer price for each supplier
  const customerPrices = supplierRatesCents.map(rate => {
    const result = calculateJobPricing({
      supplierHourlyRateCents: rate,
      durationMinutes,
      isOOH,
    });
    return result.customerPriceCents;
  });
  
  return {
    minPriceCents: Math.min(...customerPrices),
    maxPriceCents: Math.max(...customerPrices),
    avgPriceCents: Math.round(customerPrices.reduce((a, b) => a + b, 0) / customerPrices.length),
    supplierCount: supplierRatesCents.length,
    breakdown: {
      durationHours: durationMinutes / 60,
      isOOH,
      oohSurchargePercent: isOOH ? PRICING_RULES.OOH_CUSTOMER_SURCHARGE_PERCENT : 0,
    },
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
