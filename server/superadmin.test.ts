import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";

describe("Superadmin Procedures", () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  const createMockContext = (role: "user" | "admin" | "superadmin" | null): TrpcContext => {
    if (!role) {
      return { user: null, req: {} as any, res: {} as any };
    }
    return {
      user: {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        accountType: "customer" as const,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        openId: null,
        passwordHash: null,
        loginMethod: "local",
      },
      req: {} as any,
      res: {} as any,
    };
  };

  describe("Access Control", () => {
    it("should deny access to non-superadmin users", async () => {
      const caller = appRouter.createCaller(createMockContext("user"));
      await expect(caller.admin.getAllSuppliers()).rejects.toThrow("Superadmin access required");
    });

    it("should deny access to regular admin users", async () => {
      const caller = appRouter.createCaller(createMockContext("admin"));
      await expect(caller.admin.getAllSuppliers()).rejects.toThrow("Superadmin access required");
    });

    it("should allow access to superadmin users", async () => {
      const caller = appRouter.createCaller(createMockContext("superadmin"));
      const result = await caller.admin.getAllSuppliers();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Data Retrieval", () => {
    it("should get all suppliers", async () => {
      const caller = appRouter.createCaller(createMockContext("superadmin"));
      const suppliers = await caller.admin.getAllSuppliers();
      expect(Array.isArray(suppliers)).toBe(true);
      if (suppliers.length > 0) {
        expect(suppliers[0]).toHaveProperty("id");
        expect(suppliers[0]).toHaveProperty("companyName");
        expect(suppliers[0]).toHaveProperty("contactEmail");
      }
    });

    it("should get all users", async () => {
      const caller = appRouter.createCaller(createMockContext("superadmin"));
      const users = await caller.admin.getAllUsers();
      expect(Array.isArray(users)).toBe(true);
      if (users.length > 0) {
        expect(users[0]).toHaveProperty("id");
        expect(users[0]).toHaveProperty("email");
        expect(users[0]).toHaveProperty("accountType");
        expect(users[0]).toHaveProperty("role");
      }
    });

    it("should get all jobs", async () => {
      const caller = appRouter.createCaller(createMockContext("superadmin"));
      const jobs = await caller.admin.getAllJobs();
      expect(Array.isArray(jobs)).toBe(true);
      if (jobs.length > 0) {
        expect(jobs[0]).toHaveProperty("id");
        expect(jobs[0]).toHaveProperty("status");
      }
    });

    it("should get coverage statistics", async () => {
      const caller = appRouter.createCaller(createMockContext("superadmin"));
      const coverage = await caller.admin.getCoverageStats();
      expect(Array.isArray(coverage)).toBe(true);
    });

    it("should get pending verifications", async () => {
      const caller = appRouter.createCaller(createMockContext("superadmin"));
      const pending = await caller.admin.getPendingVerifications();
      expect(Array.isArray(pending)).toBe(true);
    });
  });

  describe("Verification Actions", () => {
    it("should require superadmin role for approval", async () => {
      const caller = appRouter.createCaller(createMockContext("admin"));
      await expect(
        caller.verification.approveVerification({ supplierId: 999 })
      ).rejects.toThrow("Superadmin access required");
    });

    it("should require superadmin role for rejection", async () => {
      const caller = appRouter.createCaller(createMockContext("admin"));
      await expect(
        caller.verification.rejectVerification({ supplierId: 999, reason: "Test" })
      ).rejects.toThrow("Superadmin access required");
    });

    it("should require superadmin role for resubmission request", async () => {
      const caller = appRouter.createCaller(createMockContext("admin"));
      await expect(
        caller.verification.requestResubmission({ supplierId: 999, feedback: "Test" })
      ).rejects.toThrow("Superadmin access required");
    });
  });
});
