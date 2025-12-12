import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { suppliers, supplierVerification, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("changeVerificationStatus - Auto-create verification record", () => {
  let testSupplierId: number;
  let superadminUserId: number;
  let superadminEmail: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test superadmin user
    const superadminOpenId = `test-superadmin-${Date.now()}`;
    superadminEmail = `superadmin-${Date.now()}@test.com`;
    
    await db.insert(users).values({
      openId: superadminOpenId,
      name: "Test Superadmin",
      email: superadminEmail,
      role: "superadmin",
      accountType: "customer", // accountType is customer/supplier, role is user/admin/superadmin
    });
    
    // Fetch the created user
    const [newUser] = await db.select()
      .from(users)
      .where(eq(users.openId, superadminOpenId))
      .limit(1);
    
    superadminUserId = newUser.id;

    // Create a test supplier WITHOUT a verification record
    const supplierEmail = `supplier-no-verification-${Date.now()}@test.com`;
    await db.insert(suppliers).values({
      companyName: `Test Supplier No Verification ${Date.now()}`,
      contactEmail: supplierEmail,
      contactPhone: "+1234567890",
      country: "US",
      isVerified: 0,
      verificationStatus: "pending",
      offersOutOfHours: 0,
    });

    // Fetch the created supplier
    const [testSupplier] = await db.select()
      .from(suppliers)
      .where(eq(suppliers.contactEmail, supplierEmail))
      .limit(1);

    testSupplierId = testSupplier.id;

    // Verify NO verification record exists
    const existingVerification = await db.select()
      .from(supplierVerification)
      .where(eq(supplierVerification.supplierId, testSupplierId))
      .limit(1);
    
    expect(existingVerification.length).toBe(0);
  });

  it("should auto-create verification record when changing status for supplier without one", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create caller context for superadmin
    const caller = appRouter.createCaller({
      user: {
        id: superadminUserId,
        openId: `test-superadmin-openid`,
        name: "Test Superadmin",
        email: superadminEmail,
        role: "superadmin",
        accountType: "customer",
      },
    });

    // Change status to approved (should auto-create verification record)
    await caller.admin.changeVerificationStatus({
      supplierId: testSupplierId,
      newStatus: "approved",
      reason: "Manual approval for testing - auto-created verification record",
      clearManualFlag: false,
    });

    // Verify verification record was created
    const verificationRecord = await db.select()
      .from(supplierVerification)
      .where(eq(supplierVerification.supplierId, testSupplierId))
      .limit(1);

    expect(verificationRecord.length).toBe(1);
    expect(verificationRecord[0].status).toBe("approved");
    expect(verificationRecord[0].isManuallyVerified).toBe(1);
    expect(verificationRecord[0].manualVerificationReason).toBe("Manual approval for testing - auto-created verification record");
    expect(verificationRecord[0].manuallyVerifiedBy).toBe(superadminEmail);

    // Verify supplier was marked as verified
    const updatedSupplier = await db.select()
      .from(suppliers)
      .where(eq(suppliers.id, testSupplierId))
      .limit(1);

    expect(updatedSupplier[0].isVerified).toBe(1);
    expect(updatedSupplier[0].verificationStatus).toBe("verified");
  });

  it("should handle status change from approved to rejected for auto-created record", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const caller = appRouter.createCaller({
      user: {
        id: superadminUserId,
        openId: `test-superadmin-openid`,
        name: "Test Superadmin",
        email: superadminEmail,
        role: "superadmin",
        accountType: "customer",
      },
    });

    // Change status to rejected
    await caller.admin.changeVerificationStatus({
      supplierId: testSupplierId,
      newStatus: "rejected",
      reason: "Testing rejection after auto-creation",
      clearManualFlag: false,
    });

    // Verify status changed
    const verificationRecord = await db.select()
      .from(supplierVerification)
      .where(eq(supplierVerification.supplierId, testSupplierId))
      .limit(1);

    expect(verificationRecord[0].status).toBe("rejected");
    expect(verificationRecord[0].rejectionReason).toBe("Testing rejection after auto-creation");

    // Verify supplier is no longer verified
    const updatedSupplier = await db.select()
      .from(suppliers)
      .where(eq(suppliers.id, testSupplierId))
      .limit(1);

    expect(updatedSupplier[0].isVerified).toBe(0);
    expect(updatedSupplier[0].verificationStatus).toBe("rejected");
  });

  it("should create verification record for multiple suppliers in sequence", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create 3 more suppliers without verification records
    const supplierIds: number[] = [];
    
    for (let i = 0; i < 3; i++) {
      const batchEmail = `batch-supplier-${i}-${Date.now()}@test.com`;
      await db.insert(suppliers).values({
        companyName: `Batch Test Supplier ${i} ${Date.now()}`,
        contactEmail: batchEmail,
        contactPhone: "+1234567890",
        country: "US",
        isVerified: 0,
        verificationStatus: "pending",
        offersOutOfHours: 0,
      });
      
      // Fetch the created supplier
      const [testSupplier] = await db.select()
        .from(suppliers)
        .where(eq(suppliers.contactEmail, batchEmail))
        .limit(1);
      
      supplierIds.push(testSupplier.id);
    }

    const caller = appRouter.createCaller({
      user: {
        id: superadminUserId,
        openId: `test-superadmin-openid`,
        name: "Test Superadmin",
        email: superadminEmail,
        role: "superadmin",
        accountType: "customer",
      },
    });

    // Approve all 3 suppliers
    for (const supplierId of supplierIds) {
      await caller.admin.changeVerificationStatus({
        supplierId,
        newStatus: "approved",
        reason: `Batch approval ${supplierId}`,
        clearManualFlag: false,
      });
    }

    // Verify all have verification records
    for (const supplierId of supplierIds) {
      const verificationRecord = await db.select()
        .from(supplierVerification)
        .where(eq(supplierVerification.supplierId, supplierId))
        .limit(1);

      expect(verificationRecord.length).toBe(1);
      expect(verificationRecord[0].status).toBe("approved");
    }
  }, 10000); // 10 second timeout for multiple suppliers
});
