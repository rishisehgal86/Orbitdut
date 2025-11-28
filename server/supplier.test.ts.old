import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user: Partial<AuthenticatedUser> = {}): { ctx: TrpcContext } {
  const fullUser: AuthenticatedUser = {
    id: user.id || 1,
    openId: user.openId || "test-user",
    email: user.email || "test@example.com",
    name: user.name || "Test User",
    loginMethod: user.loginMethod || "local",
    accountType: user.accountType || "supplier",
    role: user.role || "user",
    passwordHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user: fullUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("supplier router", () => {
  describe("getProfile", () => {
    it("should return undefined when supplier profile does not exist", async () => {
      const { ctx } = createAuthContext({ id: 999999 });
      const caller = appRouter.createCaller(ctx);

      const profile = await caller.supplier.getProfile({
        userId: 999999,
      });

      expect(profile).toBeUndefined();
    });
  });

  describe("createProfile", () => {
    it("should create a new supplier profile", async () => {
      const { ctx } = createAuthContext({ id: Math.floor(Math.random() * 1000000) });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.supplier.createProfile({
        companyName: "Test Company",
        contactEmail: "test@company.com",
        contactPhone: "+1234567890",
        address: "123 Test St",
        city: "Test City",
        country: "US",
        taxId: "TAX123",
      });

      expect(result.supplierId).toBeGreaterThan(0);
      expect(result.success).toBe(true);
    });
  });

  describe("rates management", () => {
    it("should create and retrieve supplier rates", async () => {
      const { ctx } = createAuthContext({ id: Math.floor(Math.random() * 1000000) });
      const caller = appRouter.createCaller(ctx);

      const supplier = await caller.supplier.createProfile({
        companyName: "Rates Test Co",
        contactEmail: "rates@test.com",
        country: "US",
      });

      // Create rate
      await caller.supplier.upsertRate({
        supplierId: supplier.supplierId,
        country: "US",
        hourlyRate: 15000, // $150.00
        currency: "USD",
      });

      // Retrieve rates
      const rates = await caller.supplier.getRates({
        supplierId: supplier.supplierId,
      });

      expect(rates).toHaveLength(1);
      expect(rates[0]?.hourlyRate).toBe(15000);
      expect(rates[0]?.currency).toBe("USD");
    });
  });
});
