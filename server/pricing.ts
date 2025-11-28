import { getSupplierRates } from "./db";

interface PricingInput {
  country: string;
  latitude: string;
  longitude: string;
  scheduledStart: Date;
  estimatedDuration: number; // in minutes
}

interface PricingResult {
  hourlyRate: number; // in cents
  currency: string;
  durationHours: number;
  basePrice: number; // in cents
  outOfHoursSurcharge: number; // in cents
  totalPrice: number; // in cents
  isOutOfHours: boolean;
}

/**
 * Calculate if the scheduled time is outside normal business hours
 * Normal hours: Monday-Friday 8:00 AM - 6:00 PM
 */
function isOutOfBusinessHours(scheduledStart: Date): boolean {
  const day = scheduledStart.getDay(); // 0 = Sunday, 6 = Saturday
  const hour = scheduledStart.getHours();

  // Weekend
  if (day === 0 || day === 6) return true;

  // Before 8 AM or after 6 PM
  if (hour < 8 || hour >= 18) return true;

  return false;
}

/**
 * Find the lowest rate from suppliers who cover the given location
 */
// TODO: Update pricing logic to use new rate schema (service type + response time)
export async function calculateJobPrice(input: PricingInput): Promise<PricingResult | null> {
  // Temporarily disabled - will be updated after new rate management system is built
  return null;
  /*
  const { country, scheduledStart, estimatedDuration } = input;

  // Get all supplier rates for this country
  const { getDb } = await import("./db");
  const { supplierRates } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  
  const db = await getDb();
  if (!db) return null;

  const rates = await db
    .select()
    .from(supplierRates)
    .where(eq(supplierRates.country, country));

  if (!rates || rates.length === 0) {
    return null;
  }

  // Find the lowest rate for this country
  const lowestRate = rates.reduce((min, rate) =>
    rate.hourlyRate < min.hourlyRate ? rate : min
  );

  // Calculate pricing
  const durationHours = estimatedDuration / 60;
  const basePrice = Math.round(lowestRate.hourlyRate * durationHours);
  const isOutOfHours = isOutOfBusinessHours(new Date(scheduledStart));
  const outOfHoursSurcharge = isOutOfHours ? Math.round(basePrice * 0.5) : 0; // 50% surcharge
  const totalPrice = basePrice + outOfHoursSurcharge;

  return {
    hourlyRate: lowestRate.hourlyRate,
    currency: lowestRate.currency,
    durationHours,
    basePrice,
    outOfHoursSurcharge,
    totalPrice,
    isOutOfHours,
  };
  */
}

/**
 * Find suppliers who can service a given location
 */
export async function findMatchingSuppliers(
  country: string,
  latitude: string,
  longitude: string,
  postalCode?: string
): Promise<number[]> {
  // TODO: Implement geographic matching logic
  // 1. Find suppliers with coverage in this country
  // 2. Check if location falls within their coverage areas:
  //    - postal_codes: check if postalCode is in the list
  //    - city_radius: calculate distance from center point
  //    - polygon: check if point is inside polygon

  // For now, return empty array
  return [];
}
