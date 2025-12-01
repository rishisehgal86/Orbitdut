import { describe, it, expect } from "vitest";
import { sendEmail } from "./_core/email";

describe("Email Service", () => {
  it("should have Gmail credentials configured", () => {
    console.log("GMAIL_USER:", process.env.GMAIL_USER ? "[SET]" : "[MISSING]");
    console.log("GMAIL_APP_PASSWORD:", process.env.GMAIL_APP_PASSWORD ? "[SET]" : "[MISSING]");
    console.log("GMAIL_USER length:", process.env.GMAIL_USER?.length);
    console.log("GMAIL_APP_PASSWORD length:", process.env.GMAIL_APP_PASSWORD?.length);
    expect(process.env.GMAIL_USER).toBeDefined();
    expect(process.env.GMAIL_APP_PASSWORD).toBeDefined();
  });

  it("should send test email successfully", async () => {
    const result = await sendEmail({
      to: process.env.GMAIL_USER!, // Send to self for testing
      subject: "Orbidut Email Test",
      html: "<h1>Test Email</h1><p>If you receive this, Gmail SMTP is working correctly!</p>",
      text: "Test Email - If you receive this, Gmail SMTP is working correctly!",
    });

    expect(result).toBe(true);
  }, 30000); // 30 second timeout for email sending
});
