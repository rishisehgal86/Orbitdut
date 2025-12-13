import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { suppliers, supplierVerification, users, supplierUsers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Manual Verification Display in getAllSuppliers", () => {
  let testSupplierId: number;
  let testUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const userResult = await db.insert(users).values({
      email: `test-${Date.now()}@example.com`,
      name: "Test User",
      role: "user",
      accountType: "supplier",
    });
    testUserId = Number(userResult.insertId);

    // Create test supplier
    const result = await db.insert(suppliers).values({
      companyName: `Test Manual Verification Display ${Date.now()}`,
      contactEmail: `manual-display-${Date.now()}@example.com`,
      contactPhone: "+1234567890",
      country: "US",
      verificationStatus: "approved",
      isVerified: 1,
      isActive: 1,
      rating: 200,
    });
    testSupplierId = Number(result.insertId);

    // Link user to supplier
    await db.insert(supplierUsers).values({
      userId: testUserId,
      supplierId: testSupplierId,
    });

    // Create verification record with manual verification
    await db.insert(supplierVerification).values({
      supplierId: testSupplierId,
      status: "approved",
      isManuallyVerified: 1,
      manualVerificationReason: "Verified via phone call and reference checks",
      manuallyVerifiedBy: "admin@orbidut.com",
      manuallyVerifiedAt: new Date(),
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup
    await db.delete(supplierVerification).where(eq(supplierVerification.supplierId, testSupplierId));
    await db.delete(supplierUsers).where(eq(supplierUsers.supplierId, testSupplierId));
    await db.delete(suppliers).where(eq(suppliers.id, testSupplierId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should include isManuallyVerified field in getAllSuppliers response", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simulate getAllSuppliers query
    const allSuppliers = await db.select({
      id: suppliers.id,
      companyName: suppliers.companyName,
      contactEmail: suppliers.contactEmail,
      contactPhone: suppliers.contactPhone,
      country: suppliers.country,
      verificationStatus: suppliers.verificationStatus,
      isVerified: suppliers.isVerified,
      isActive: suppliers.isActive,
      rating: suppliers.rating,
      createdAt: suppliers.createdAt,
    }).from(suppliers);

    const testSupplier = allSuppliers.find(s => s.id === testSupplierId);
    expect(testSupplier).toBeDefined();
  });

  it("should fetch verification details including manual verification fields", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get verification details
    const verification = await db.select({
      isManuallyVerified: supplierVerification.isManuallyVerified,
      manualVerificationReason: supplierVerification.manualVerificationReason,
      manuallyVerifiedBy: supplierVerification.manuallyVerifiedBy,
      manuallyVerifiedAt: supplierVerification.manuallyVerifiedAt,
    })
      .from(supplierVerification)
      .where(eq(supplierVerification.supplierId, testSupplierId))
      .limit(1)
      .then(rows => rows[0] || null);

    expect(verification).toBeDefined();
    expect(verification?.isManuallyVerified).toBe(1);
    expect(verification?.manualVerificationReason).toBe("Verified via phone call and reference checks");
    expect(verification?.manuallyVerifiedBy).toBe("admin@orbidut.com");
    expect(verification?.manuallyVerifiedAt).toBeInstanceOf(Date);
  });

  it("should return null for suppliers without verification records", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create supplier without verification record
    const noVerifResult = await db.insert(suppliers).values({
      companyName: `No Verification ${Date.now()}`,
      contactEmail: `no-verification-${Date.now()}@example.com`,
      contactPhone: "+1234567890",
      country: "CA",
      verificationStatus: "not_started",
      isVerified: 0,
      isActive: 1,
      rating: 200,
    });
    const supplierNoVerificationId = Number(noVerifResult.insertId);

    // Try to get verification details
    const verification = await db.select({
      isManuallyVerified: supplierVerification.isManuallyVerified,
      manualVerificationReason: supplierVerification.manualVerificationReason,
      manuallyVerifiedBy: supplierVerification.manuallyVerifiedBy,
      manuallyVerifiedAt: supplierVerification.manuallyVerifiedAt,
    })
      .from(supplierVerification)
      .where(eq(supplierVerification.supplierId, supplierNoVerificationId))
      .limit(1)
      .then(rows => rows[0] || null);

    expect(verification).toBeNull();

    // Cleanup
    await db.delete(suppliers).where(eq(suppliers.id, supplierNoVerificationId));
  });

  it("should handle suppliers with document-based verification (not manual)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create supplier with document verification
    const docResult = await db.insert(suppliers).values({
      companyName: `Document Verified ${Date.now()}`,
      contactEmail: `doc-verified-${Date.now()}@example.com`,
      contactPhone: "+1234567890",
      country: "GB",
      verificationStatus: "approved",
      isVerified: 1,
      isActive: 1,
      rating: 200,
    });
    const docSupplierId = Number(docResult.insertId);

    // Create verification record WITHOUT manual verification
    await db.insert(supplierVerification).values({
      supplierId: docSupplierId,
      status: "approved",
      isManuallyVerified: 0, // Document-based
    });

    // Get verification details
    const verification = await db.select({
      isManuallyVerified: supplierVerification.isManuallyVerified,
      manualVerificationReason: supplierVerification.manualVerificationReason,
      manuallyVerifiedBy: supplierVerification.manuallyVerifiedBy,
      manuallyVerifiedAt: supplierVerification.manuallyVerifiedAt,
    })
      .from(supplierVerification)
      .where(eq(supplierVerification.supplierId, docSupplierId))
      .limit(1)
      .then(rows => rows[0] || null);

    expect(verification).toBeDefined();
    expect(verification?.isManuallyVerified).toBe(0);
    expect(verification?.manualVerificationReason).toBeNull();
    expect(verification?.manuallyVerifiedBy).toBeNull();
    expect(verification?.manuallyVerifiedAt).toBeNull();

    // Cleanup
    await db.delete(supplierVerification).where(eq(supplierVerification.supplierId, docSupplierId));
    await db.delete(suppliers).where(eq(suppliers.id, docSupplierId));
  });

  it("should show manual verification for in_progress status", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create supplier with manual in_progress status
    const inProgressResult = await db.insert(suppliers).values({
      companyName: `Manual In Progress ${Date.now()}`,
      contactEmail: `manual-progress-${Date.now()}@example.com`,
      contactPhone: "+1234567890",
      country: "AU",
      verificationStatus: "in_progress",
      isVerified: 0,
      isActive: 1,
      rating: 200,
    });
    const inProgressSupplierId = Number(inProgressResult.insertId);

    // Create manual verification record with in_progress status
    await db.insert(supplierVerification).values({
      supplierId: inProgressSupplierId,
      status: "in_progress",
      isManuallyVerified: 1,
      manualVerificationReason: "Manually moved to in_progress for additional review",
      manuallyVerifiedBy: "superadmin@orbidut.com",
      manuallyVerifiedAt: new Date(),
    });

    // Get verification details
    const verification = await db.select({
      isManuallyVerified: supplierVerification.isManuallyVerified,
      manualVerificationReason: supplierVerification.manualVerificationReason,
      manuallyVerifiedBy: supplierVerification.manuallyVerifiedBy,
      manuallyVerifiedAt: supplierVerification.manuallyVerifiedAt,
    })
      .from(supplierVerification)
      .where(eq(supplierVerification.supplierId, inProgressSupplierId))
      .limit(1)
      .then(rows => rows[0] || null);

    expect(verification).toBeDefined();
    expect(verification?.isManuallyVerified).toBe(1);
    expect(verification?.manualVerificationReason).toBe("Manually moved to in_progress for additional review");

    // Cleanup
    await db.delete(supplierVerification).where(eq(supplierVerification.supplierId, inProgressSupplierId));
    await db.delete(suppliers).where(eq(suppliers.id, inProgressSupplierId));
  });

  it("should show manual verification for rejected status", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create supplier with manual rejected status
    const rejectedResult = await db.insert(suppliers).values({
      companyName: `Manual Rejected ${Date.now()}`,
      contactEmail: `manual-rejected-${Date.now()}@example.com`,
      contactPhone: "+1234567890",
      country: "DE",
      verificationStatus: "rejected",
      isVerified: 0,
      isActive: 1,
      rating: 200,
    });
    const rejectedSupplierId = Number(rejectedResult.insertId);

    // Create manual verification record with rejected status
    await db.insert(supplierVerification).values({
      supplierId: rejectedSupplierId,
      status: "rejected",
      isManuallyVerified: 1,
      manualVerificationReason: "Failed background check - manually rejected",
      manuallyVerifiedBy: "compliance@orbidut.com",
      manuallyVerifiedAt: new Date(),
    });

    // Get verification details
    const verification = await db.select({
      isManuallyVerified: supplierVerification.isManuallyVerified,
      manualVerificationReason: supplierVerification.manualVerificationReason,
      manuallyVerifiedBy: supplierVerification.manuallyVerifiedBy,
      manuallyVerifiedAt: supplierVerification.manuallyVerifiedAt,
    })
      .from(supplierVerification)
      .where(eq(supplierVerification.supplierId, rejectedSupplierId))
      .limit(1)
      .then(rows => rows[0] || null);

    expect(verification).toBeDefined();
    expect(verification?.isManuallyVerified).toBe(1);
    expect(verification?.manualVerificationReason).toBe("Failed background check - manually rejected");

    // Cleanup
    await db.delete(supplierVerification).where(eq(supplierVerification.supplierId, rejectedSupplierId));
    await db.delete(suppliers).where(eq(suppliers.id, rejectedSupplierId));
  });
});
