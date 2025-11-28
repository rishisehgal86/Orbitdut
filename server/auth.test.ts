import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[]; setCookies: any[] } {
  const clearedCookies: any[] = [];
  const setCookies: any[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies, setCookies };
}

describe("auth.signup", () => {
  it("creates a new customer account with hashed password", async () => {
    const { ctx, setCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.signup({
      name: "Test Customer",
      email: `customer-${Date.now()}@test.com`,
      password: "testpassword123",
      accountType: "customer",
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Test Customer");
    expect(result.user.accountType).toBe("customer");
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("creates a new supplier account", async () => {
    const { ctx, setCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.signup({
      name: "Test Supplier",
      email: `supplier-${Date.now()}@test.com`,
      password: "testpassword123",
      accountType: "supplier",
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe("Test Supplier");
    expect(result.user.accountType).toBe("supplier");
    expect(setCookies).toHaveLength(1);
  });

  it("rejects duplicate email addresses", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const email = `duplicate-${Date.now()}@test.com`;

    await caller.auth.signup({
      name: "First User",
      email,
      password: "testpassword123",
      accountType: "customer",
    });

    await expect(
      caller.auth.signup({
        name: "Second User",
        email,
        password: "testpassword123",
        accountType: "customer",
      })
    ).rejects.toThrow("Email already registered");
  });
});

describe("auth.login", () => {
  it("logs in with correct credentials", async () => {
    const { ctx, setCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const email = `login-test-${Date.now()}@test.com`;
    const password = "testpassword123";

    // Create account
    await caller.auth.signup({
      name: "Login Test",
      email,
      password,
      accountType: "customer",
    });

    // Clear cookies from signup
    setCookies.length = 0;

    // Login
    const result = await caller.auth.login({
      email,
      password,
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe(email);
    expect(setCookies).toHaveLength(1);
    expect(setCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("rejects invalid password", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const email = `invalid-password-${Date.now()}@test.com`;

    await caller.auth.signup({
      name: "Test User",
      email,
      password: "correctpassword",
      accountType: "customer",
    });

    await expect(
      caller.auth.login({
        email,
        password: "wrongpassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });

  it("rejects non-existent email", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({
        email: "nonexistent@test.com",
        password: "anypassword",
      })
    ).rejects.toThrow("Invalid email or password");
  });
});
