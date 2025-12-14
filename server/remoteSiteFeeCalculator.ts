/**
 * REMOTE SITE FEE CALCULATOR
 * 
 * Calculates distance-based travel surcharges for sites beyond 50km from major cities.
 * 
 * BUSINESS RULES:
 * - Nearest city coverage zone: 0-50km from nearest major city (250k+ population)
 * - Remote site fee: $1.00 USD per km for distance beyond 50km
 * - Customer pays: $1.00/km
 * - Supplier receives: $0.50/km
 * - Platform keeps: $0.50/km (50% margin on travel fees)
 * - Mandatory for all suppliers (no opt-out)
 */

import { findNearestMajorCity } from './geonames';

// ============================================================================
// CONSTANTS
// ============================================================================

export const REMOTE_SITE_FEE_RULES = {
  FREE_ZONE_KM: 50,                    // No fee within 50km
  CUSTOMER_RATE_PER_KM_USD: 1.00,      // Customer pays $1/km
  SUPPLIER_RATE_PER_KM_USD: 0.50,      // Supplier receives $0.50/km
  PLATFORM_RATE_PER_KM_USD: 0.50,      // Platform keeps $0.50/km
  SEARCH_RADIUS_KM: 300,               // Search for major cities within 300km (GeoNames free tier max)
} as const;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RemoteSiteFeeInput {
  siteLatitude: number;
  siteLongitude: number;
}

export interface RemoteSiteFeeResult {
  // Distance information
  nearestMajorCity: string | null;
  distanceToMajorCityKm: number | null;
  billableDistanceKm: number; // Distance beyond nearest city coverage zone (0 if within zone)
  
  // Fee breakdown (all in cents)
  customerFeeCents: number;
  supplierFeeCents: number;
  platformFeeCents: number;
  
  // Flags
  isRemoteSite: boolean; // true if beyond nearest city coverage zone
  hasNearbyMajorCity: boolean; // false if no major city found within search radius
  isServiceable: boolean; // false if location is too remote (>300km from major city)
}

// ============================================================================
// CORE CALCULATION
// ============================================================================

/**
 * Calculate remote site fee based on distance from nearest major city
 * 
 * @param input - Site coordinates
 * @returns Complete remote site fee breakdown
 */
export async function calculateRemoteSiteFee(
  input: RemoteSiteFeeInput
): Promise<RemoteSiteFeeResult> {
  const { siteLatitude, siteLongitude } = input;
  
  // Find nearest major city (250k+ population)
  const nearestCity = await findNearestMajorCity(
    siteLatitude,
    siteLongitude,
    REMOTE_SITE_FEE_RULES.SEARCH_RADIUS_KM
  );
  
  // If no major city found within 300km, location is unserviceable
  if (!nearestCity) {
    return {
      nearestMajorCity: null,
      distanceToMajorCityKm: null,
      billableDistanceKm: 0,
      customerFeeCents: 0,
      supplierFeeCents: 0,
      platformFeeCents: 0,
      isRemoteSite: false,
      hasNearbyMajorCity: false,
      isServiceable: false, // Too remote to service
    };
  }
  
  const distanceKm = nearestCity.distanceKm;
  
    // Calculate billable distance (only distance beyond nearest city coverage zone)
  const billableDistanceKm = Math.max(0, distanceKm - REMOTE_SITE_FEE_RULES.FREE_ZONE_KM);
  
  // If within nearest city coverage zone, no fee applies
  if (billableDistanceKm === 0) {
    return {
      nearestMajorCity: nearestCity.cityName,
      distanceToMajorCityKm: distanceKm,
      billableDistanceKm: 0,
      customerFeeCents: 0,
      supplierFeeCents: 0,
      platformFeeCents: 0,
      isRemoteSite: false,
      hasNearbyMajorCity: true,
      isServiceable: true,
    };
  }
  
  // Calculate fees (convert USD to cents)
  const customerFeeCents = Math.round(
    billableDistanceKm * REMOTE_SITE_FEE_RULES.CUSTOMER_RATE_PER_KM_USD * 100
  );
  
  const supplierFeeCents = Math.round(
    billableDistanceKm * REMOTE_SITE_FEE_RULES.SUPPLIER_RATE_PER_KM_USD * 100
  );
  
  const platformFeeCents = Math.round(
    billableDistanceKm * REMOTE_SITE_FEE_RULES.PLATFORM_RATE_PER_KM_USD * 100
  );
  
  // Verify accounting integrity (customer fee = supplier fee + platform fee)
  const calculatedTotal = supplierFeeCents + platformFeeCents;
  if (Math.abs(calculatedTotal - customerFeeCents) > 1) {
    throw new Error(
      `Remote site fee calculation error: Customer pays ${customerFeeCents}, ` +
      `but supplier receives ${supplierFeeCents} + platform earns ${platformFeeCents} = ${calculatedTotal}`
    );
  }
  
  return {
    nearestMajorCity: nearestCity.cityName,
    distanceToMajorCityKm: distanceKm,
    billableDistanceKm,
    customerFeeCents,
    supplierFeeCents,
    platformFeeCents,
    isRemoteSite: true,
    hasNearbyMajorCity: true,
    isServiceable: true,
  };
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format remote site fee for customer display
 */
export function formatRemoteSiteFeeForCustomer(result: RemoteSiteFeeResult): string {
  if (!result.isRemoteSite) {
    if (!result.hasNearbyMajorCity) {
      return 'No major city found nearby';
    }
    return `No remote site fee (within ${REMOTE_SITE_FEE_RULES.FREE_ZONE_KM}km of ${result.nearestMajorCity})`;
  }
  
  const feeUSD = (result.customerFeeCents / 100).toFixed(2);
  return `Remote Site Fee: $${feeUSD} (${result.billableDistanceKm.toFixed(1)}km beyond nearest city coverage zone)`;
}

/**
 * Format distance information for display
 */
export function formatDistanceInfo(result: RemoteSiteFeeResult): string {
  if (!result.hasNearbyMajorCity) {
    return 'No major city found within 200km';
  }
  
  return `${result.distanceToMajorCityKm?.toFixed(1)}km from ${result.nearestMajorCity}`;
}
