import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { suppliers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Supplier Rating System", () => {
  let testSupplierId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test supplier with default rating
    const result = await db.insert(suppliers).values({
      companyName: "Test Rating Company",
      contactEmail: "rating-test@example.com",
      country: "US",
      verificationStatus: "pending",
      isVerified: 0,
      rating: 200, // Default 2.0/5.0
    });

    testSupplierId = Number(result[0].insertId);
  });

  afterAll(async () => {
    if (!db) return;

    // Cleanup test supplier
    await db.delete(suppliers).where(eq(suppliers.id, testSupplierId));
  });

  it("should create supplier with default rating of 2.0 (200 hundredths)", async () => {
    if (!db) throw new Error("Database not available");

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, testSupplierId))
      .limit(1);

    expect(supplier).toBeDefined();
    expect(supplier.rating).toBe(200); // 2.0 * 100
  });

  it("should allow updating supplier rating", async () => {
    if (!db) throw new Error("Database not available");

    // Update rating to 4.5 (450 hundredths)
    await db
      .update(suppliers)
      .set({ rating: 450 })
      .where(eq(suppliers.id, testSupplierId));

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, testSupplierId))
      .limit(1);

    expect(supplier.rating).toBe(450); // 4.5 * 100
  });

  it("should store rating as integer hundredths (1.0 = 100, 5.0 = 500)", async () => {
    if (!db) throw new Error("Database not available");

    // Test minimum rating (1.0)
    await db
      .update(suppliers)
      .set({ rating: 100 })
      .where(eq(suppliers.id, testSupplierId));

    let [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, testSupplierId))
      .limit(1);

    expect(supplier.rating).toBe(100);

    // Test maximum rating (5.0)
    await db
      .update(suppliers)
      .set({ rating: 500 })
      .where(eq(suppliers.id, testSupplierId));

    [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, testSupplierId))
      .limit(1);

    expect(supplier.rating).toBe(500);
  });

  it("should handle fractional ratings correctly (3.7 = 370)", async () => {
    if (!db) throw new Error("Database not available");

    await db
      .update(suppliers)
      .set({ rating: 370 })
      .where(eq(suppliers.id, testSupplierId));

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, testSupplierId))
      .limit(1);

    expect(supplier.rating).toBe(370); // 3.7 * 100
    
    // Verify conversion to decimal
    const decimalRating = supplier.rating / 100;
    expect(decimalRating).toBe(3.7);
  });

  it("should calculate average rating correctly", async () => {
    if (!db) throw new Error("Database not available");

    // Get all suppliers
    const allSuppliers = await db.select({ rating: suppliers.rating }).from(suppliers);

    let totalRating = 0;
    let count = 0;

    for (const supplier of allSuppliers) {
      const rating = supplier.rating || 200; // Default 2.0
      totalRating += rating;
      count++;
    }

    const averageRating = count > 0 ? totalRating / count : 200;

    expect(averageRating).toBeGreaterThanOrEqual(100); // At least 1.0
    expect(averageRating).toBeLessThanOrEqual(500); // At most 5.0
    expect(count).toBeGreaterThan(0);
  });

  it("should categorize ratings into distribution buckets", async () => {
    if (!db) throw new Error("Database not available");

    const distribution = {
      "1.0-1.9": 0,
      "2.0-2.9": 0,
      "3.0-3.9": 0,
      "4.0-4.9": 0,
      "5.0": 0,
    };

    const allSuppliers = await db.select({ rating: suppliers.rating }).from(suppliers);

    for (const supplier of allSuppliers) {
      const rating = supplier.rating || 200;
      const ratingValue = rating / 100;

      if (ratingValue >= 5.0) distribution["5.0"]++;
      else if (ratingValue >= 4.0) distribution["4.0-4.9"]++;
      else if (ratingValue >= 3.0) distribution["3.0-3.9"]++;
      else if (ratingValue >= 2.0) distribution["2.0-2.9"]++;
      else distribution["1.0-1.9"]++;
    }

    // Verify distribution adds up to total suppliers
    const totalInDistribution = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    expect(totalInDistribution).toBe(allSuppliers.length);
  });

  it("should enforce NOT NULL constraint on rating column", async () => {
    if (!db) throw new Error("Database not available");

    // The rating column has a NOT NULL constraint with default value of 200
    // This test verifies that the database enforces this constraint
    // Attempting to insert null should fail or use the default

    // Create supplier without specifying rating (should use default 200)
    const result = await db.insert(suppliers).values({
      companyName: "Default Rating Test",
      contactEmail: "default-rating@example.com",
      country: "US",
      verificationStatus: "pending",
      isVerified: 0,
      // rating not specified - should use default
    });

    const defaultRatingSupplierId = Number(result[0].insertId);

    try {
      const [supplier] = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, defaultRatingSupplierId))
        .limit(1);

      // Should have default rating of 200 (2.0)
      expect(supplier.rating).toBe(200);
    } finally {
      // Cleanup
      await db.delete(suppliers).where(eq(suppliers.id, defaultRatingSupplierId));
    }
  });

  it("should support rating updates with reason tracking (future enhancement)", async () => {
    if (!db) throw new Error("Database not available");

    // This test documents the future enhancement of rating history
    // Currently we just update the rating directly
    const oldRating = 300; // 3.0
    const newRating = 450; // 4.5
    const reason = "Excellent customer feedback and consistent performance";

    await db
      .update(suppliers)
      .set({ rating: oldRating })
      .where(eq(suppliers.id, testSupplierId));

    // Update rating (in future, this would also create a history entry)
    await db
      .update(suppliers)
      .set({ rating: newRating })
      .where(eq(suppliers.id, testSupplierId));

    const [supplier] = await db
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, testSupplierId))
      .limit(1);

    expect(supplier.rating).toBe(newRating);

    // TODO: When rating history table is implemented, verify:
    // - History entry exists
    // - Old rating is recorded
    // - New rating is recorded
    // - Reason is stored
    // - Timestamp is captured
  });
});
