import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "admin@orbitdut.com";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "vijagqgzkmskfsjc";

console.log("Testing Gmail SMTP connection...");
console.log("User:", GMAIL_USER);
console.log("Password length:", GMAIL_APP_PASSWORD.length);
console.log("Password first 4 chars:", GMAIL_APP_PASSWORD.substring(0, 4));
console.log("");

// Try with explicit SMTP settings instead of service: "gmail"
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD,
  },
  debug: true, // Enable debug output
  logger: true, // Enable logger
});

try {
  console.log("Verifying connection...");
  await transporter.verify();
  console.log("✅ Connection verified successfully!");
  
  console.log("\nSending test email...");
  const info = await transporter.sendMail({
    from: `"Orbidut Test" <${GMAIL_USER}>`,
    to: GMAIL_USER,
    subject: "Gmail SMTP Test - Direct Connection",
    text: "If you receive this, Gmail SMTP is working!",
    html: "<h1>Success!</h1><p>Gmail SMTP is working correctly with direct SMTP settings.</p>",
  });
  
  console.log("✅ Email sent successfully!");
  console.log("Message ID:", info.messageId);
  process.exit(0);
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Full error:", error);
  process.exit(1);
}
