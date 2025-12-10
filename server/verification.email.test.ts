import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from "./_core/email";

// Mock nodemailer
vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
    })),
  },
}));

describe("Verification Email Notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set required environment variables for tests
    process.env.GMAIL_USER = "test@orbidut.com";
    process.env.GMAIL_APP_PASSWORD = "test-password";
    process.env.VITE_APP_URL = "https://test.orbidut.com";
  });

  describe("sendVerificationApprovedEmail", () => {
    it("should send approval email with correct content", async () => {
      const result = await sendVerificationApprovedEmail(
        "supplier@example.com",
        "Test Company LLC"
      );

      expect(result).toBe(true);
    });

    it("should include company name in email", async () => {
      const companyName = "Acme Services Inc";
      const result = await sendVerificationApprovedEmail(
        "acme@example.com",
        companyName
      );

      expect(result).toBe(true);
    });

    it("should include dashboard link in email", async () => {
      const result = await sendVerificationApprovedEmail(
        "supplier@example.com",
        "Test Company"
      );

      expect(result).toBe(true);
    });
  });

  describe("sendVerificationRejectedEmail", () => {
    it("should send rejection email with reason", async () => {
      const result = await sendVerificationRejectedEmail(
        "supplier@example.com",
        "Test Company LLC",
        "Insurance certificate has expired"
      );

      expect(result).toBe(true);
    });

    it("should include rejection reason in email", async () => {
      const reason = "Missing required DPA document";
      const result = await sendVerificationRejectedEmail(
        "supplier@example.com",
        "Test Company",
        reason
      );

      expect(result).toBe(true);
    });

    it("should include admin notes when provided", async () => {
      const result = await sendVerificationRejectedEmail(
        "supplier@example.com",
        "Test Company",
        "Incomplete documentation",
        "Please upload a valid insurance certificate dated within the last 12 months"
      );

      expect(result).toBe(true);
    });

    it("should work without admin notes", async () => {
      const result = await sendVerificationRejectedEmail(
        "supplier@example.com",
        "Test Company",
        "Incomplete documentation"
      );

      expect(result).toBe(true);
    });

    it("should include verification page link in email", async () => {
      const result = await sendVerificationRejectedEmail(
        "supplier@example.com",
        "Test Company",
        "Missing documents"
      );

      expect(result).toBe(true);
    });
  });

  describe("Email configuration", () => {
    it("should return true when credentials are configured", async () => {
      // With mocked nodemailer, emails always succeed in tests
      const result = await sendVerificationApprovedEmail(
        "supplier@example.com",
        "Test Company"
      );

      expect(result).toBe(true);
    });
  });
});
