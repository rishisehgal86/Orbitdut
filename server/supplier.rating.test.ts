import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { suppliers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Supplier Rating System", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it("should have rating column in suppliers table", async () => {
    const result = await db!.execute(`
      SELECT COLUMN_NAME, COLUMN_DEFAULT, COLUMN_COMMENT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'suppliers' AND COLUMN_NAME = 'rating'
    `);
    
    expect(result[0]).toBeDefined();
    expect(result[0].length).toBeGreaterThan(0);
    expect(result[0][0].COLUMN_DEFAULT).toBe("200");
    expect(result[0][0].COLUMN_COMMENT).toContain("2.0/5.0");
  });

  it("should ensure all existing suppliers have 2.0 rating", async () => {
    const allSuppliers = await db!.select({ id: suppliers.id, rating: suppliers.rating })
      .from(suppliers);
    
    expect(allSuppliers.length).toBeGreaterThan(0);
    
    allSuppliers.forEach(supplier => {
      expect(supplier.rating).toBe(200); // 2.0/5.0
    });
  });

  it("should default to 2.0 rating for new suppliers", async () => {
    // This test verifies the database default value
    // The actual signup flow is tested in auth tests
    const testSupplier = await db!.insert(suppliers).values({
      companyName: "Rating Test Co",
      contactEmail: "rating@test.com",
      country: "US",
      verificationStatus: "pending",
      isVerified: 0,
      // Note: NOT setting rating field - should use default
    });

    const supplierId = Number(testSupplier[0].insertId);
    
    const inserted = await db!.select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    expect(inserted[0].rating).toBe(200); // Should default to 2.0/5.0
    
    // Cleanup
    await db!.delete(suppliers).where(eq(suppliers.id, supplierId));
  });

  it("should store ratings as hundredths (200 = 2.0)", async () => {
    const testSupplier = await db!.insert(suppliers).values({
      companyName: "Rating Format Test",
      contactEmail: "format@test.com",
      country: "US",
      verificationStatus: "pending",
      isVerified: 0,
      rating: 350, // 3.5/5.0
    });

    const supplierId = Number(testSupplier[0].insertId);
    
    const inserted = await db!.select()
      .from(suppliers)
      .where(eq(suppliers.id, supplierId))
      .limit(1);

    expect(inserted[0].rating).toBe(350);
    expect(inserted[0].rating / 100).toBe(3.5); // Converts to 3.5/5.0
    
    // Cleanup
    await db!.delete(suppliers).where(eq(suppliers.id, supplierId));
  });

  it("should support rating range from 1.0 to 5.0", async () => {
    const testCases = [
      { rating: 100, expected: 1.0 }, // Minimum
      { rating: 200, expected: 2.0 }, // Default
      { rating: 350, expected: 3.5 }, // Mid-range
      { rating: 500, expected: 5.0 }, // Maximum
    ];

    for (const testCase of testCases) {
      const result = await db!.insert(suppliers).values({
        companyName: `Rating ${testCase.expected} Test`,
        contactEmail: `rating${testCase.rating}@test.com`,
        country: "US",
        verificationStatus: "pending",
        isVerified: 0,
        rating: testCase.rating,
      });

      const supplierId = Number(result[0].insertId);
      
      const inserted = await db!.select()
        .from(suppliers)
        .where(eq(suppliers.id, supplierId))
        .limit(1);

      expect(inserted[0].rating).toBe(testCase.rating);
      expect(inserted[0].rating / 100).toBe(testCase.expected);
      
      // Cleanup
      await db!.delete(suppliers).where(eq(suppliers.id, supplierId));
    }
  });
});
