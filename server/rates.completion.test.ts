import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { getRateCompletionStats } from "./rates";
import { suppliers, supplierCoverageCountries, supplierPriorityCities, supplierRates, supplierServiceExclusions, supplierResponseTimeExclusions } from "../drizzle/schema";

describe("Rate Completion Statistics", () => {
  let testSupplierId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test supplier
    const [supplier] = await db.insert(suppliers).values({
      companyName: "Test Rate Stats Company",
      contactEmail: "ratestats@test.com",
      country: "US",
    }).$returningId();
    testSupplierId = supplier.id;

    // Add 2 countries
    await db.insert(supplierCoverageCountries).values([
      { supplierId: testSupplierId, countryCode: "US", countryName: "United States", region: "Americas" },
      { supplierId: testSupplierId, countryCode: "GB", countryName: "United Kingdom", region: "Europe" },
    ]);

    // Add 1 city
    await db.insert(supplierPriorityCities).values({
      supplierId: testSupplierId,
      cityName: "New York",
      countryCode: "US",
      timezone: "America/New_York",
    });

    // Add some rates
    // US - L1_EUC - all 3 service levels configured
    await db.insert(supplierRates).values([
      { supplierId: testSupplierId, countryCode: "US", serviceType: "L1_EUC", serviceLevel: "same_business_day", rateUsdCents: 10000 },
      { supplierId: testSupplierId, countryCode: "US", serviceType: "L1_EUC", serviceLevel: "next_business_day", rateUsdCents: 8000 },
      { supplierId: testSupplierId, countryCode: "US", serviceType: "L1_EUC", serviceLevel: "scheduled", rateUsdCents: 6000 },
    ]);

    // GB - L1_NETWORK - only 2 service levels configured
    await db.insert(supplierRates).values([
      { supplierId: testSupplierId, countryCode: "GB", serviceType: "L1_NETWORK", serviceLevel: "same_business_day", rateUsdCents: 12000 },
      { supplierId: testSupplierId, countryCode: "GB", serviceType: "L1_NETWORK", serviceLevel: "next_business_day", rateUsdCents: 9000 },
      // scheduled is missing
    ]);

    // Exclude SMART_HANDS for US (service-level exclusion)
    await db.insert(supplierServiceExclusions).values({
      supplierId: testSupplierId,
      countryCode: "US",
      serviceType: "SMART_HANDS",
    });

    // Exclude scheduled service level for GB L1_EUC (response-level exclusion)
    await db.insert(supplierResponseTimeExclusions).values({
      supplierId: testSupplierId,
      countryCode: "GB",
      serviceType: "L1_EUC",
      serviceLevel: "scheduled",
    });
  });

  afterAll(async () => {
    if (!db) return;
    // Clean up test data
    await db.delete(supplierResponseTimeExclusions).where({ supplierId: testSupplierId });
    await db.delete(supplierServiceExclusions).where({ supplierId: testSupplierId });
    await db.delete(supplierRates).where({ supplierId: testSupplierId });
    await db.delete(supplierPriorityCities).where({ supplierId: testSupplierId });
    await db.delete(supplierCoverageCountries).where({ supplierId: testSupplierId });
    await db.delete(suppliers).where({ id: testSupplierId });
  });

  it("should calculate overall completion stats correctly", async () => {
    const stats = await getRateCompletionStats(testSupplierId);

    // Expected calculation:
    // 2 countries + 1 city = 3 locations
    // 3 service types (L1_EUC, L1_NETWORK, SMART_HANDS)
    // 3 service levels per service type
    // Total possible slots: 3 locations × 3 services × 3 levels = 27 slots
    
    // Exclusions:
    // - US SMART_HANDS (all 3 levels) = 3 excluded
    // - GB L1_EUC scheduled = 1 excluded
    // - New York city has no exclusions yet
    // Total excluded: 4
    
    // Configured rates: 5 (3 for US L1_EUC + 2 for GB L1_NETWORK)
    // Total non-excluded slots: 27 - 4 = 23
    // Missing: 23 - 5 = 18

    expect(stats.total).toBe(23);
    expect(stats.configured).toBe(5);
    expect(stats.missing).toBe(18);
    expect(stats.excluded).toBe(4);
    expect(stats.percentage).toBeCloseTo(21.7, 1); // 5/23 ≈ 21.7%
  });

  it("should calculate breakdown by service type", async () => {
    const stats = await getRateCompletionStats(testSupplierId);

    // L1_EUC: 
    // - US: 3 configured (all levels)
    // - GB: 0 configured, 2 missing (same_business_day, next_business_day), 1 excluded (scheduled)
    // - New York: 0 configured, 3 missing
    // Total: 3 configured, 5 missing, 8 total
    const l1EucStats = stats.byServiceType.find(s => s.serviceType === "L1_EUC");
    expect(l1EucStats).toBeDefined();
    expect(l1EucStats?.configured).toBe(3);
    expect(l1EucStats?.missing).toBe(5);
    expect(l1EucStats?.total).toBe(8);

    // L1_NETWORK:
    // - US: 0 configured, 3 missing
    // - GB: 2 configured, 1 missing
    // - New York: 0 configured, 3 missing
    // Total: 2 configured, 7 missing, 9 total
    const l1NetworkStats = stats.byServiceType.find(s => s.serviceType === "L1_NETWORK");
    expect(l1NetworkStats).toBeDefined();
    expect(l1NetworkStats?.configured).toBe(2);
    expect(l1NetworkStats?.missing).toBe(7);
    expect(l1NetworkStats?.total).toBe(9);

    // SMART_HANDS:
    // - US: 3 excluded
    // - GB: 0 configured, 3 missing
    // - New York: 0 configured, 3 missing
    // Total: 0 configured, 6 missing, 6 total (excluding US)
    const smartHandsStats = stats.byServiceType.find(s => s.serviceType === "SMART_HANDS");
    expect(smartHandsStats).toBeDefined();
    expect(smartHandsStats?.configured).toBe(0);
    expect(smartHandsStats?.missing).toBe(6);
    expect(smartHandsStats?.total).toBe(6);
  });

  it("should calculate breakdown by location type", async () => {
    const stats = await getRateCompletionStats(testSupplierId);

    // Countries (US + GB):
    // - US: 3 configured (L1_EUC all 3 levels), 3 missing (L1_NETWORK all 3 levels), 3 excluded (SMART_HANDS all 3 levels)
    //   US non-excluded: 3 configured + 3 missing = 6 total
    // - GB: 2 configured (L1_NETWORK same/next), 6 missing (L1_EUC same/next + L1_NETWORK scheduled + SMART_HANDS all 3), 1 excluded (L1_EUC scheduled)
    //   GB non-excluded: 2 configured + 6 missing = 8 total
    // Total countries: 5 configured, 9 missing, 14 total
    const countriesStats = stats.byLocationType.find(l => l.locationType === "countries");
    expect(countriesStats).toBeDefined();
    expect(countriesStats?.configured).toBe(5);
    expect(countriesStats?.missing).toBe(9);
    expect(countriesStats?.total).toBe(14);

    // Cities (New York):
    // - All 3 services × 3 levels = 9 slots
    // - 0 configured, 9 missing
    const citiesStats = stats.byLocationType.find(l => l.locationType === "cities");
    expect(citiesStats).toBeDefined();
    expect(citiesStats?.configured).toBe(0);
    expect(citiesStats?.missing).toBe(9);
    expect(citiesStats?.total).toBe(9);
  });

  it("should handle supplier with no coverage", async () => {
    // Create supplier with no coverage
    const [emptySupplier] = await db!.insert(suppliers).values({
      companyName: "Empty Supplier",
      contactEmail: "empty@test.com",
      country: "US",
    }).$returningId();

    const stats = await getRateCompletionStats(emptySupplier.id);

    expect(stats.total).toBe(0);
    expect(stats.configured).toBe(0);
    expect(stats.missing).toBe(0);
    expect(stats.excluded).toBe(0);
    expect(stats.percentage).toBe(0);

    // Clean up
    await db!.delete(suppliers).where({ id: emptySupplier.id });
  });

  it("should handle 100% completion", async () => {
    // Create supplier with complete rates
    const [completeSupplier] = await db!.insert(suppliers).values({
      companyName: "Complete Supplier",
      contactEmail: "complete@test.com",
      country: "US",
    }).$returningId();

    // Add 1 country
    await db!.insert(supplierCoverageCountries).values({
      supplierId: completeSupplier.id,
      countryCode: "FR",
      countryName: "France",
      region: "Europe",
    });

    // Add all rates for all service types and levels
    const allRates = [];
    for (const serviceType of ["L1_EUC", "L1_NETWORK", "SMART_HANDS"]) {
      for (const serviceLevel of ["same_business_day", "next_business_day", "scheduled"]) {
        allRates.push({
          supplierId: completeSupplier.id,
          countryCode: "FR",
          serviceType,
          serviceLevel: serviceLevel as "same_business_day" | "next_business_day" | "scheduled",
          rateUsdCents: 10000,
        });
      }
    }
    await db!.insert(supplierRates).values(allRates);

    const stats = await getRateCompletionStats(completeSupplier.id);

    expect(stats.total).toBe(9); // 1 country × 3 services × 3 levels
    expect(stats.configured).toBe(9);
    expect(stats.missing).toBe(0);
    expect(stats.percentage).toBe(100);

    // Clean up
    await db!.delete(supplierRates).where({ supplierId: completeSupplier.id });
    await db!.delete(supplierCoverageCountries).where({ supplierId: completeSupplier.id });
    await db!.delete(suppliers).where({ id: completeSupplier.id });
  });
});
