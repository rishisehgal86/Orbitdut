import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { MySql2Database } from "drizzle-orm/mysql2";

/**
 * Tests for jobs.getEstimatedPrice procedure
 * 
 * This procedure calculates pricing estimates based on:
 * - Supplier rates for the location and service type
 * - Service level (same_day, next_day, scheduled)
 * - Duration in minutes
 * - OOH conditions (out-of-hours surcharge)
 * - Platform fee (15%)
 */

describe("jobs.getEstimatedPrice", () => {
  let db: MySql2Database | null;
  let testSupplierId1: number;
  let testSupplierId2: number;
  let testSupplierId3: number;
  let testCityId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    const { suppliers, supplierCoverageCountries, supplierPriorityCities, supplierRates } = await import("../drizzle/schema");

    // Create test suppliers
    const supplier1Result = await db.insert(suppliers).values({
      companyName: "Test Supplier 1 - NYC",
      contactEmail: "supplier1@test.com",
      contactPhone: "+1234567890",
      country: "US",
      verificationStatus: "verified",
      isVerified: 1,
      isActive: 1,
      offersOutOfHours: 1,
      rating: 400, // 4.0/5.0
    });
    testSupplierId1 = Number(supplier1Result[0].insertId);

    const supplier2Result = await db.insert(suppliers).values({
      companyName: "Test Supplier 2 - NYC",
      contactEmail: "supplier2@test.com",
      contactPhone: "+1234567891",
      country: "US",
      verificationStatus: "verified",
      isVerified: 1,
      isActive: 1,
      offersOutOfHours: 0, // Does NOT offer OOH
      rating: 300, // 3.0/5.0
    });
    testSupplierId2 = Number(supplier2Result[0].insertId);

    const supplier3Result = await db.insert(suppliers).values({
      companyName: "Test Supplier 3 - LA",
      contactEmail: "supplier3@test.com",
      contactPhone: "+1234567892",
      country: "US",
      verificationStatus: "verified",
      isVerified: 1,
      isActive: 1,
      offersOutOfHours: 1,
      rating: 450, // 4.5/5.0
    });
    testSupplierId3 = Number(supplier3Result[0].insertId);

    // Add country coverage for all suppliers
    await db.insert(supplierCoverageCountries).values([
      { supplierId: testSupplierId1, countryCode: "US" },
      { supplierId: testSupplierId2, countryCode: "US" },
      { supplierId: testSupplierId3, countryCode: "US" },
    ]);

    // Add priority city for NYC
    const cityResult = await db.insert(supplierPriorityCities).values({
      supplierId: testSupplierId1,
      cityName: "New York",
      countryCode: "US",
    });
    testCityId = Number(cityResult[0].insertId);

    // Add rates for suppliers
    // Supplier 1: NYC city-specific rate
    await db.insert(supplierRates).values([
      {
        supplierId: testSupplierId1,
        cityId: testCityId,
        countryCode: null,
        serviceType: "Level 1 End User Compute Engineer",
        serviceLevel: "same_business_day",
        rateUsdCents: 10000, // $100/hr
        isServiceable: 1,
      },
      {
        supplierId: testSupplierId1,
        cityId: testCityId,
        countryCode: null,
        serviceType: "Level 1 End User Compute Engineer",
        serviceLevel: "next_business_day",
        rateUsdCents: 8000, // $80/hr
        isServiceable: 1,
      },
      {
        supplierId: testSupplierId1,
        cityId: testCityId,
        countryCode: null,
        serviceType: "Level 1 End User Compute Engineer",
        serviceLevel: "scheduled",
        rateUsdCents: 6000, // $60/hr
        isServiceable: 1,
      },
    ]);

    // Supplier 2: Country-wide rate (lower than city-specific)
    await db.insert(supplierRates).values([
      {
        supplierId: testSupplierId2,
        cityId: null,
        countryCode: "US",
        serviceType: "Level 1 End User Compute Engineer",
        serviceLevel: "same_business_day",
        rateUsdCents: 9000, // $90/hr
        isServiceable: 1,
      },
      {
        supplierId: testSupplierId2,
        cityId: null,
        countryCode: "US",
        serviceType: "Level 1 End User Compute Engineer",
        serviceLevel: "next_business_day",
        rateUsdCents: 7000, // $70/hr
        isServiceable: 1,
      },
    ]);

    // Supplier 3: Country-wide rate for LA
    await db.insert(supplierRates).values([
      {
        supplierId: testSupplierId3,
        cityId: null,
        countryCode: "US",
        serviceType: "Level 1 End User Compute Engineer",
        serviceLevel: "scheduled",
        rateUsdCents: 5000, // $50/hr
        isServiceable: 1,
      },
    ]);
  });

  afterAll(async () => {
    if (!db) return;

    const { suppliers, supplierCoverageCountries, supplierPriorityCities, supplierRates } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Clean up test data
    await db.delete(supplierRates).where(eq(supplierRates.supplierId, testSupplierId1));
    await db.delete(supplierRates).where(eq(supplierRates.supplierId, testSupplierId2));
    await db.delete(supplierRates).where(eq(supplierRates.supplierId, testSupplierId3));
    await db.delete(supplierPriorityCities).where(eq(supplierPriorityCities.id, testCityId));
    await db.delete(supplierCoverageCountries).where(eq(supplierCoverageCountries.supplierId, testSupplierId1));
    await db.delete(supplierCoverageCountries).where(eq(supplierCoverageCountries.supplierId, testSupplierId2));
    await db.delete(supplierCoverageCountries).where(eq(supplierCoverageCountries.supplierId, testSupplierId3));
    await db.delete(suppliers).where(eq(suppliers.id, testSupplierId1));
    await db.delete(suppliers).where(eq(suppliers.id, testSupplierId2));
    await db.delete(suppliers).where(eq(suppliers.id, testSupplierId3));
  });

  it("should calculate pricing for same_day service in NYC (2 suppliers)", async () => {
    const caller = appRouter.createCaller({ user: null });

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "Level 1 End User Compute Engineer",
      serviceLevel: "same_day",
      durationMinutes: 240, // 4 hours
      city: "New York",
      country: "US",
      scheduledDateTime: "2025-01-15T10:00", // Weekday, business hours
      timezone: "America/New_York",
    });

    expect(result.available).toBe(true);
    expect(result.supplierCount).toBe(2); // Supplier 1 (city) and Supplier 2 (country)
    expect(result.estimatedPriceCents).toBeGreaterThan(0);
    expect(result.minPriceCents).toBeGreaterThan(0);
    expect(result.maxPriceCents).toBeGreaterThan(0);
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown?.durationHours).toBe(4);
    expect(result.breakdown?.isOOH).toBe(false);
    expect(result.breakdown?.platformFeePercent).toBe(15);

    // Verify pricing calculation
    // Supplier 1: $100/hr * 4hr = $400 * 1.15 = $460
    // Supplier 2: $90/hr * 4hr = $360 * 1.15 = $414
    expect(result.minPriceCents).toBe(41400); // $414
    expect(result.maxPriceCents).toBe(46000); // $460
  });

  it("should calculate pricing for next_day service in NYC", async () => {
    const caller = appRouter.createCaller({ user: null });

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "Level 1 End User Compute Engineer",
      serviceLevel: "next_day",
      durationMinutes: 180, // 3 hours
      city: "New York",
      country: "US",
      scheduledDateTime: "2025-01-16T14:00",
      timezone: "America/New_York",
    });

    expect(result.available).toBe(true);
    expect(result.supplierCount).toBe(2);
    expect(result.breakdown?.durationHours).toBe(3);

    // Supplier 1: $80/hr * 3hr = $240 * 1.15 = $276
    // Supplier 2: $70/hr * 3hr = $210 * 1.15 = $241.50
    expect(result.minPriceCents).toBe(24150); // $241.50
    expect(result.maxPriceCents).toBe(27600); // $276
  });

  it("should calculate pricing for scheduled service in NYC", async () => {
    const caller = appRouter.createCaller({ user: null });

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "Level 1 End User Compute Engineer",
      serviceLevel: "scheduled",
      durationMinutes: 120, // 2 hours (minimum)
      city: "New York",
      country: "US",
      scheduledDateTime: "2025-01-20T09:00",
      timezone: "America/New_York",
    });

    expect(result.available).toBe(true);
    expect(result.supplierCount).toBe(2); // Supplier 1 (city) and Supplier 3 (country)
    expect(result.breakdown?.durationHours).toBe(2);

    // Supplier 1: $60/hr * 2hr = $120 * 1.15 = $138
    // Supplier 3: $50/hr * 2hr = $100 * 1.15 = $115
    expect(result.minPriceCents).toBe(11500); // $115
    expect(result.maxPriceCents).toBe(13800); // $138
  });

  it("should apply OOH surcharge for evening booking (25%)", async () => {
    const caller = appRouter.createCaller({ user: null });

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "Level 1 End User Compute Engineer",
      serviceLevel: "same_day",
      durationMinutes: 240, // 4 hours
      city: "New York",
      country: "US",
      scheduledDateTime: "2025-01-15T18:00", // 6 PM - OOH
      timezone: "America/New_York",
    });

    expect(result.available).toBe(true);
    expect(result.supplierCount).toBe(1); // Only Supplier 1 (offers OOH)
    expect(result.breakdown?.isOOH).toBe(true);
    expect(result.breakdown?.oohPremiumPercent).toBe(25);

    // Supplier 1 only (Supplier 2 doesn't offer OOH)
    // Base: $100/hr * 4hr = $400
    // OOH: $400 * 1.25 = $500
    // Platform fee: $500 * 1.15 = $575
    expect(result.minPriceCents).toBe(57500);
    expect(result.maxPriceCents).toBe(57500);
  });

  it("should apply OOH surcharge for weekend booking", async () => {
    const caller = appRouter.createCaller({ user: null });

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "Level 1 End User Compute Engineer",
      serviceLevel: "scheduled",
      durationMinutes: 180, // 3 hours
      city: "New York",
      country: "US",
      scheduledDateTime: "2025-01-18T10:00", // Saturday - OOH
      timezone: "America/New_York",
    });

    expect(result.available).toBe(true);
    expect(result.supplierCount).toBe(2); // Supplier 1 (city) and Supplier 3 (country) both offer OOH
    expect(result.breakdown?.isOOH).toBe(true);
    expect(result.breakdown?.oohPremiumPercent).toBe(25);

    // Supplier 1: $60/hr * 3hr = $180, OOH: $180 * 1.25 = $225, Platform: $225 * 1.15 = $258.75
    // Supplier 3: $50/hr * 3hr = $150, OOH: $150 * 1.25 = $187.50, Platform: $187.50 * 1.15 = $215.625
    expect(result.minPriceCents).toBe(21563); // $215.63 (rounded)
    expect(result.maxPriceCents).toBe(25875); // $258.75
  });

  it("should return unavailable when no suppliers in location", async () => {
    const caller = appRouter.createCaller({ user: null });

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "Level 1 End User Compute Engineer",
      serviceLevel: "same_day",
      durationMinutes: 240,
      city: "Tokyo",
      country: "ZZ", // Use invalid country code to ensure no suppliers
      scheduledDateTime: "2025-01-15T10:00",
      timezone: "Asia/Tokyo",
    });

    expect(result.available).toBe(false);
    expect(result.message).toBe("No suppliers available in this location");
    expect(result.supplierCount).toBe(0);
    expect(result.estimatedPriceCents).toBeNull();
  });

  it("should return unavailable when no rates configured for service level", async () => {
    const caller = appRouter.createCaller({ user: null });

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "L1 Network Engineer", // No rates for this service type
      serviceLevel: "same_day",
      durationMinutes: 240,
      city: "New York",
      country: "US",
      scheduledDateTime: "2025-01-15T10:00",
      timezone: "America/New_York",
    });

    expect(result.available).toBe(false);
    expect(result.message).toContain("No suppliers have configured rates");
    expect(result.supplierCount).toBe(0);
  });

  it("should return unavailable for OOH when no suppliers offer OOH", async () => {
    const caller = appRouter.createCaller({ user: null });

    // Create a location where only Supplier 2 (no OOH) has rates
    const { supplierRates } = await import("../drizzle/schema");
    
    // Temporarily add a rate for Supplier 2 in a different service type
    await db!.insert(supplierRates).values({
      supplierId: testSupplierId2,
      cityId: null,
      countryCode: "US",
      serviceType: "Smart Hands",
      serviceLevel: "same_business_day",
      rateUsdCents: 5000,
      isServiceable: 1,
    });

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "Smart Hands",
      serviceLevel: "same_day",
      durationMinutes: 120,
      city: "Los Angeles", // Only Supplier 2 available
      country: "US",
      scheduledDateTime: "2025-01-18T10:00", // Saturday - OOH
      timezone: "America/Los_Angeles",
    });

    expect(result.available).toBe(false);
    expect(result.message).toContain("No suppliers available for out-of-hours service");
    expect(result.supplierCount).toBe(0);

    // Clean up
    const { eq, and } = await import("drizzle-orm");
    await db!.delete(supplierRates).where(
      and(
        eq(supplierRates.supplierId, testSupplierId2),
        eq(supplierRates.serviceType, "Smart Hands")
      )
    );
  });

  it("should handle minimum duration (2 hours)", async () => {
    const caller = appRouter.createCaller({ user: null });

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "Level 1 End User Compute Engineer",
      serviceLevel: "scheduled",
      durationMinutes: 120, // Minimum
      city: "New York",
      country: "US",
      scheduledDateTime: "2025-01-20T10:00",
      timezone: "America/New_York",
    });

    expect(result.available).toBe(true);
    expect(result.breakdown?.durationHours).toBe(2);
  });

  it("should handle maximum duration (16 hours)", async () => {
    const caller = appRouter.createCaller({ user: null });

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "Level 1 End User Compute Engineer",
      serviceLevel: "scheduled",
      durationMinutes: 960, // Maximum (16 hours)
      city: "New York",
      country: "US",
      scheduledDateTime: "2025-01-20T09:00",
      timezone: "America/New_York",
    });

    expect(result.available).toBe(true);
    expect(result.breakdown?.durationHours).toBe(16);
    expect(result.supplierCount).toBe(2); // Supplier 1 (city) and Supplier 3 (country)

    // Supplier 1: $60/hr * 16hr = $960 * 1.15 = $1104
    // Supplier 3: $50/hr * 16hr = $800 * 1.15 = $920
    // Verify the range is correct
    expect(result.minPriceCents).toBeGreaterThan(90000); // Around $920
    expect(result.maxPriceCents).toBeGreaterThan(100000); // Around $1104
    expect(result.maxPriceCents).toBeGreaterThan(result.minPriceCents!);
  });

  it("should prioritize city-specific rates over country rates", async () => {
    const caller = appRouter.createCaller({ user: null });

    // Supplier 1 has city-specific rate ($100/hr)
    // Supplier 2 has country-wide rate ($90/hr)
    // Both should be included, with city rate being higher

    const result = await caller.jobs.getEstimatedPrice({
      serviceType: "Level 1 End User Compute Engineer",
      serviceLevel: "same_day",
      durationMinutes: 120,
      city: "New York",
      country: "US",
      scheduledDateTime: "2025-01-15T10:00",
      timezone: "America/New_York",
    });

    expect(result.available).toBe(true);
    expect(result.supplierCount).toBe(2);

    // City rate should be higher than country rate
    expect(result.maxPriceCents).toBeGreaterThan(result.minPriceCents!);
  });
});
