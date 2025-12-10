import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Superadmin Verification System", () => {
  const mockSuperadminContext: Context = {
    user: {
      id: 1,
      email: "admin@orbidut.com",
      name: "Super Admin",
      role: "superadmin",
      accountType: "customer",
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockSuperadminContext);

  it("should fetch all supplier verifications grouped by status", async () => {
    const result = await caller.admin.getAllSupplierVerifications();

    // Verify the structure
    expect(result).toHaveProperty("notStarted");
    expect(result).toHaveProperty("inProgress");
    expect(result).toHaveProperty("pendingReview");
    expect(result).toHaveProperty("underReview");
    expect(result).toHaveProperty("approved");
    expect(result).toHaveProperty("rejected");
    expect(result).toHaveProperty("resubmissionRequired");

    // Verify each group is an array
    expect(Array.isArray(result.notStarted)).toBe(true);
    expect(Array.isArray(result.inProgress)).toBe(true);
    expect(Array.isArray(result.pendingReview)).toBe(true);
    expect(Array.isArray(result.underReview)).toBe(true);
    expect(Array.isArray(result.approved)).toBe(true);
    expect(Array.isArray(result.rejected)).toBe(true);
    expect(Array.isArray(result.resubmissionRequired)).toBe(true);

    // If there are any suppliers, verify the structure
    const allSuppliers = [
      ...result.notStarted,
      ...result.inProgress,
      ...result.pendingReview,
      ...result.underReview,
      ...result.approved,
      ...result.rejected,
      ...result.resubmissionRequired,
    ];

    if (allSuppliers.length > 0) {
      const supplier = allSuppliers[0];
      
      // Verify required fields
      expect(supplier).toHaveProperty("supplierId");
      expect(supplier).toHaveProperty("companyName");
      expect(supplier).toHaveProperty("contactName");
      expect(supplier).toHaveProperty("contactPersonEmail");
      expect(supplier).toHaveProperty("contactPersonPhone");
      expect(supplier).toHaveProperty("verificationStatus");
      expect(supplier).toHaveProperty("documentsCount");
      expect(supplier).toHaveProperty("completionPercentage");

      console.log("✓ Found", allSuppliers.length, "suppliers in database");
      console.log("  - Not Started:", result.notStarted.length);
      console.log("  - In Progress:", result.inProgress.length);
      console.log("  - Pending Review:", result.pendingReview.length);
      console.log("  - Under Review:", result.underReview.length);
      console.log("  - Approved:", result.approved.length);
      console.log("  - Rejected:", result.rejected.length);
      console.log("  - Resubmission Required:", result.resubmissionRequired.length);
    } else {
      console.log("⚠ No suppliers found in database (this is okay for a fresh install)");
    }
  });

  it("should fetch verification details for a specific supplier", async () => {
    // First get all suppliers to find one to test with
    const allVerifications = await caller.admin.getAllSupplierVerifications();
    const allSuppliers = [
      ...allVerifications.notStarted,
      ...allVerifications.inProgress,
      ...allVerifications.pendingReview,
      ...allVerifications.underReview,
      ...allVerifications.approved,
      ...allVerifications.rejected,
      ...allVerifications.resubmissionRequired,
    ];

    if (allSuppliers.length > 0) {
      const testSupplierId = allSuppliers[0].supplierId;
      
      const details = await caller.admin.getVerificationDetails({ supplierId: testSupplierId });

      // Verify structure
      expect(details).toHaveProperty("supplier");
      expect(details).toHaveProperty("verification");
      expect(details).toHaveProperty("profile");
      expect(details).toHaveProperty("documents");

      expect(details.supplier.id).toBe(testSupplierId);
      expect(Array.isArray(details.documents)).toBe(true);

      console.log("✓ Successfully fetched details for supplier ID:", testSupplierId);
      console.log("  - Company:", details.supplier.companyName);
      console.log("  - Documents:", details.documents.length);
      console.log("  - Verification Status:", details.verification?.status || "not_started");
    } else {
      console.log("⚠ Skipping detail test - no suppliers in database");
    }
  });
});
