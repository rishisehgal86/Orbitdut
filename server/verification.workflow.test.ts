import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, suppliers, supplierUsers, supplierVerification } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Mock email functions
vi.mock("./_core/email", () => ({
  sendVerificationApprovedEmail: vi.fn().mockResolvedValue(true),
  sendVerificationRejectedEmail: vi.fn().mockResolvedValue(true),
  sendEmail: vi.fn().mockResolvedValue(true),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(true),
  sendJobStatusEmail: vi.fn().mockResolvedValue(true),
  sendMessageNotificationEmail: vi.fn().mockResolvedValue(true),
  sendJobAssignmentNotification: vi.fn().mockResolvedValue(true),
}));

describe("Verification Workflow Integration", () => {
  let testUserId: number;
  let testSupplierId: number;
  let adminUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test admin user
    const [adminUser] = await db.insert(users).values({
      email: `admin-verify-test-${Date.now()}@test.com`,
      name: "Admin User",
      passwordHash: "test-hash",
      accountType: "supplier",
      role: "admin",
    });
    adminUserId = adminUser.insertId;

    // Create test supplier user
    const [user] = await db.insert(users).values({
      email: `supplier-verify-test-${Date.now()}@test.com`,
      name: "Test Supplier User",
      passwordHash: "test-hash",
      accountType: "supplier",
    });
    testUserId = user.insertId;

    // Create test supplier company
    const [supplier] = await db.insert(suppliers).values({
      companyName: "Test Verification Company",
      contactEmail: `supplier-verify-${Date.now()}@test.com`,
      contactPhone: "+1234567890",
      address: "123 Test St",
      city: "Test City",
      country: "US",
      verificationStatus: "pending",
      isVerified: 0,
    });
    testSupplierId = supplier.insertId;

    // Link user to supplier
    await db.insert(supplierUsers).values({
      userId: testUserId,
      supplierId: testSupplierId,
      role: "supplier_admin",
    });

    // Create verification record
    await db.insert(supplierVerification).values({
      supplierId: testSupplierId,
      status: "pending_review",
      insuranceCertUrl: "https://example.com/insurance.pdf",
      dpaDocumentUrl: "https://example.com/dpa.pdf",
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup test data
    if (testSupplierId) {
      await db.delete(supplierVerification).where(eq(supplierVerification.supplierId, testSupplierId));
      await db.delete(supplierUsers).where(eq(supplierUsers.supplierId, testSupplierId));
      await db.delete(suppliers).where(eq(suppliers.id, testSupplierId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (adminUserId) {
      await db.delete(users).where(eq(users.id, adminUserId));
    }
  });

  describe("Approve Verification", () => {
    it("should approve verification and send email", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const caller = appRouter.createCaller({
        user: { id: adminUserId, email: "admin@test.com", role: "admin" },
      });

      const result = await caller.admin.approveVerification({
        supplierId: testSupplierId,
      });

      expect(result.success).toBe(true);

      // Verify database was updated
      const [updatedSupplier] = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, testSupplierId));

      expect(updatedSupplier.isVerified).toBe(1);
      expect(updatedSupplier.verificationStatus).toBe("verified");

      const [verification] = await db
        .select()
        .from(supplierVerification)
        .where(eq(supplierVerification.supplierId, testSupplierId));

      expect(verification.status).toBe("approved");
      expect(verification.reviewedBy).toBe(adminUserId);
      expect(verification.approvedAt).toBeTruthy();

      // Verify email was called
      const { sendVerificationApprovedEmail } = await import("./_core/email");
      expect(sendVerificationApprovedEmail).toHaveBeenCalled();
    });
  });

  describe("Reject Verification", () => {
    it("should reject verification and send email with reason", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Reset supplier to pending for rejection test
      await db.update(suppliers)
        .set({ isVerified: 0, verificationStatus: "pending" })
        .where(eq(suppliers.id, testSupplierId));

      await db.update(supplierVerification)
        .set({ status: "pending_review", reviewedBy: null, reviewedAt: null })
        .where(eq(supplierVerification.supplierId, testSupplierId));

      const caller = appRouter.createCaller({
        user: { id: adminUserId, email: "admin@test.com", role: "admin" },
      });

      const rejectionReason = "Insurance certificate has expired";
      const result = await caller.admin.rejectVerification({
        supplierId: testSupplierId,
        reason: rejectionReason,
      });

      expect(result.success).toBe(true);

      // Verify database was updated
      const [updatedSupplier] = await db
        .select()
        .from(suppliers)
        .where(eq(suppliers.id, testSupplierId));

      expect(updatedSupplier.isVerified).toBe(0);
      expect(updatedSupplier.verificationStatus).toBe("rejected");

      const [verification] = await db
        .select()
        .from(supplierVerification)
        .where(eq(supplierVerification.supplierId, testSupplierId));

      expect(verification.status).toBe("rejected");
      expect(verification.reviewedBy).toBe(adminUserId);
      expect(verification.rejectionReason).toBe(rejectionReason);

      // Verify email was called
      const { sendVerificationRejectedEmail } = await import("./_core/email");
      expect(sendVerificationRejectedEmail).toHaveBeenCalled();
    });
  });
});
