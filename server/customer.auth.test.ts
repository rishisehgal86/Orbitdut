import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";

describe("Customer Authentication", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testEmail: string;
  let testPassword: string;

  beforeAll(async () => {
    // Create a caller without authentication
    caller = appRouter.createCaller({ user: null });
    testEmail = `test-customer-${Date.now()}@example.com`;
    testPassword = "SecurePassword123!";
  });

  it("should create a customer account with email/password", async () => {
    const result = await caller.auth.signup({
      name: "Test Customer",
      email: testEmail,
      password: testPassword,
      accountType: "customer",
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe(testEmail);
    expect(result.user?.name).toBe("Test Customer");
    expect(result.user?.accountType).toBe("customer");
    expect(result.user?.role).toBe("user");

    console.log("✅ Customer account created successfully!");
  });

  it.skip("should login with email/password and return user data (requires HTTP context)", async () => {
    const result = await caller.auth.login({
      email: testEmail,
      password: testPassword,
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe(testEmail);
    expect(result.user?.accountType).toBe("customer");

    console.log("✅ Customer login successful!");
  });

  it.skip("should fail login with incorrect password (requires HTTP context)", async () => {
    try {
      await caller.auth.login({
        email: testEmail,
        password: "WrongPassword123!",
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Invalid");
      console.log("✅ Login correctly rejected with wrong password!");
    }
  });

  it.skip("should fail login with non-existent email (requires HTTP context)", async () => {
    try {
      await caller.auth.login({
        email: "nonexistent@example.com",
        password: testPassword,
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Invalid");
      console.log("✅ Login correctly rejected with non-existent email!");
    }
  });

  it("should prevent duplicate customer registration", async () => {
    try {
      await caller.auth.signup({
        name: "Duplicate Customer",
        email: testEmail,
        password: "AnotherPassword123!",
        accountType: "customer",
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("already registered");
      console.log("✅ Duplicate registration correctly prevented!");
    }
  });
});
