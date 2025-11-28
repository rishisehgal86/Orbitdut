import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import type { User } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user?: Partial<AuthenticatedUser>): TrpcContext {
  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "test-supplier-user",
    email: "supplier@example.com",
    name: "Test Supplier",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...user,
  };

  return {
    user: defaultUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("supplier router", () => {
  describe("getProfile", () => {
    it("should return undefined when supplier profile does not exist", async () => {
      const ctx = createAuthContext({ id: 999 });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.supplier.getProfile();
      expect(result).toBeUndefined();
    });
  });

  describe("createProfile", () => {
    it("should create a supplier profile successfully", async () => {
      const ctx = createAuthContext({ id: Math.floor(Math.random() * 1000000) });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.supplier.createProfile({
        companyName: "Test Supplier Co",
        contactEmail: "contact@testsupplier.com",
        contactPhone: "+1234567890",
        address: "123 Test St",
        city: "Test City",
        country: "US",
        taxId: "TAX123",
      });

      expect(result.success).toBe(true);
      expect(result.supplierId).toBeGreaterThan(0);
    });

    it("should validate required fields", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.supplier.createProfile({
          companyName: "",
          contactEmail: "invalid-email",
          country: "US",
        } as any)
      ).rejects.toThrow();
    });
  });

  describe("updateProfile", () => {
    it("should update supplier profile", async () => {
      const ctx = createAuthContext({ id: Math.floor(Math.random() * 1000000) });
      const caller = appRouter.createCaller(ctx);

      // First create a profile
      const created = await caller.supplier.createProfile({
        companyName: "Original Name",
        contactEmail: "original@test.com",
        country: "US",
      });

      // Then update it
      const result = await caller.supplier.updateProfile({
        supplierId: created.supplierId,
        companyName: "Updated Name",
        contactEmail: "updated@test.com",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("rates management", () => {
    it("should upsert and retrieve supplier rates", async () => {
      const ctx = createAuthContext({ id: Math.floor(Math.random() * 1000000) });
      const caller = appRouter.createCaller(ctx);

      // Create supplier first
      const supplier = await caller.supplier.createProfile({
        companyName: "Rate Test Co",
        contactEmail: "rates@test.com",
        country: "US",
      });

      // Upsert a rate
      await caller.supplier.upsertRate({
        supplierId: supplier.supplierId,
        country: "US",
        hourlyRate: 5000, // $50.00 in cents
        currency: "USD",
      });

      // Retrieve rates
      const rates = await caller.supplier.getRates({
        supplierId: supplier.supplierId,
      });

      expect(rates).toHaveLength(1);
      expect(rates[0]?.hourlyRate).toBe(5000);
      expect(rates[0]?.currency).toBe("USD");
    });
  });

  describe("coverage management", () => {
    it("should create and retrieve supplier coverage", async () => {
      const ctx = createAuthContext({ id: Math.floor(Math.random() * 1000000) });
      const caller = appRouter.createCaller(ctx);

      // Create supplier first
      const supplier = await caller.supplier.createProfile({
        companyName: "Coverage Test Co",
        contactEmail: "coverage@test.com",
        country: "US",
      });

      // Create coverage area
      await caller.supplier.createCoverage({
        supplierId: supplier.supplierId,
        coverageType: "city_radius",
        country: "US",
        coverageData: "New York",
        radiusKm: 50,
        centerLat: "40.7128",
        centerLng: "-74.0060",
      });

      // Retrieve coverage
      const coverage = await caller.supplier.getCoverage({
        supplierId: supplier.supplierId,
      });

      expect(coverage).toHaveLength(1);
      expect(coverage[0]?.coverageType).toBe("city_radius");
      expect(coverage[0]?.radiusKm).toBe(50);
    });

    it("should delete coverage area", async () => {
      const ctx = createAuthContext({ id: Math.floor(Math.random() * 1000000) });
      const caller = appRouter.createCaller(ctx);

      // Create supplier and coverage
      const supplier = await caller.supplier.createProfile({
        companyName: "Delete Test Co",
        contactEmail: "delete@test.com",
        country: "US",
      });

      await caller.supplier.createCoverage({
        supplierId: supplier.supplierId,
        coverageType: "postal_codes",
        country: "US",
        coverageData: "10001,10002,10003",
      });

      const coverage = await caller.supplier.getCoverage({
        supplierId: supplier.supplierId,
      });

      expect(coverage).toHaveLength(1);

      // Delete the coverage
      const result = await caller.supplier.deleteCoverage({
        id: coverage[0]!.id,
      });

      expect(result.success).toBe(true);

      // Verify it's deleted
      const afterDelete = await caller.supplier.getCoverage({
        supplierId: supplier.supplierId,
      });

      expect(afterDelete).toHaveLength(0);
    });
  });
});
