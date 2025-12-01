import nodemailer from "nodemailer";

// Handle both ESM and CommonJS imports
const createTransport = nodemailer.createTransport || (nodemailer as any).default?.createTransport;

// Gmail SMTP configuration - read at runtime
function getGmailConfig() {
  return {
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
    FROM_EMAIL: process.env.FROM_EMAIL || process.env.GMAIL_USER || "noreply@orbidut.com",
    APP_URL: process.env.VITE_APP_URL || "http://localhost:3000",
  };
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = getGmailConfig();
  if (!transporter && GMAIL_USER && GMAIL_APP_PASSWORD && createTransport) {
    transporter = createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });
  }
  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Gmail SMTP
 */
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  try {
    const transport = getTransporter();
    
    if (!transport) {
      console.warn("Gmail SMTP not configured (GMAIL_USER or GMAIL_APP_PASSWORD missing), skipping email send");
      return false;
    }

    const { FROM_EMAIL } = getGmailConfig();
    const info = await transport.sendMail({
      from: `"Orbidut" <${FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetToken: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const resetUrl = `${APP_URL}/auth/reset-password/${resetToken}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Orbidut</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Reset Your Password</h2>
    
    <p>Hi ${name},</p>
    
    <p>We received a request to reset your password for your Orbidut account. Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reset Password</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="color: #667eea; word-break: break-all; font-size: 14px;">${resetUrl}</p>
    
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">This link will expire in 1 hour for security reasons.</p>
    
    <p style="color: #6b7280; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      Orbidut - Connect with Trusted Service Providers Instantly<br>
      <a href="${APP_URL}" style="color: #667eea; text-decoration: none;">Visit Orbidut</a>
    </p>
  </div>
</body>
</html>
`;

  const text = `
Reset Your Password

Hi ${name},

We received a request to reset your password for your Orbidut account.

Click this link to create a new password:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

---
Orbidut - Connect with Trusted Service Providers Instantly
Visit: ${APP_URL}
`;

  return sendEmail({
    to: email,
    subject: "Reset Your Orbidut Password",
    html,
    text,
  });
}

/**
 * Send job status update email
 */
export async function sendJobStatusEmail(
  email: string,
  customerName: string,
  jobId: number,
  serviceType: string,
  oldStatus: string,
  newStatus: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const jobUrl = `${APP_URL}/customer/job/${jobId}`;

  const statusLabels: Record<string, string> = {
    pending_supplier_acceptance: "Awaiting Supplier",
    assigned_to_supplier: "Supplier Assigned",
    accepted: "Accepted",
    en_route: "Engineer En Route",
    on_site: "Engineer On Site",
    completed: "Completed",
    cancelled: "Cancelled",
    declined: "Declined",
  };

  const statusLabel = statusLabels[newStatus] || newStatus;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Job Status Update</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Orbidut</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Job Status Update</h2>
    
    <p>Hi ${customerName},</p>
    
    <p>Your job request has been updated:</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Job ID:</strong> #${jobId}</p>
      <p style="margin: 0 0 10px 0;"><strong>Service Type:</strong> ${serviceType}</p>
      <p style="margin: 0;"><strong>New Status:</strong> <span style="color: #667eea; font-weight: 600;">${statusLabel}</span></p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${jobUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Job Details</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      Orbidut - Connect with Trusted Service Providers Instantly<br>
      <a href="${APP_URL}" style="color: #667eea; text-decoration: none;">Visit Orbidut</a>
    </p>
  </div>
</body>
</html>
`;

  const text = `
Job Status Update

Hi ${customerName},

Your job request has been updated:

Job ID: #${jobId}
Service Type: ${serviceType}
New Status: ${statusLabel}

View job details: ${jobUrl}

---
Orbidut - Connect with Trusted Service Providers Instantly
Visit: ${APP_URL}
`;

  return sendEmail({
    to: email,
    subject: `Job #${jobId} Status Update: ${statusLabel}`,
    html,
    text,
  });
}

/**
 * Send new message notification email
 */
export async function sendMessageNotificationEmail(
  email: string,
  recipientName: string,
  senderName: string,
  jobId: number,
  serviceType: string,
  messagePreview: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const jobUrl = `${APP_URL}/customer/job/${jobId}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Orbidut</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">New Message</h2>
    
    <p>Hi ${recipientName},</p>
    
    <p>You have a new message from <strong>${senderName}</strong> regarding your job:</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0;"><strong>Job ID:</strong> #${jobId}</p>
      <p style="margin: 0 0 15px 0;"><strong>Service Type:</strong> ${serviceType}</p>
      <p style="margin: 0; color: #6b7280; font-style: italic;">"${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? "..." : ""}"</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${jobUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">View Message</a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    
    <p style="color: #9ca3af; font-size: 12px; text-align: center;">
      Orbidut - Connect with Trusted Service Providers Instantly<br>
      <a href="${APP_URL}" style="color: #667eea; text-decoration: none;">Visit Orbidut</a>
    </p>
  </div>
</body>
</html>
`;

  const text = `
New Message

Hi ${recipientName},

You have a new message from ${senderName} regarding your job:

Job ID: #${jobId}
Service Type: ${serviceType}

Message: "${messagePreview.substring(0, 200)}${messagePreview.length > 200 ? "..." : ""}"

View message: ${jobUrl}

---
Orbidut - Connect with Trusted Service Providers Instantly
Visit: ${APP_URL}
`;

  return sendEmail({
    to: email,
    subject: `New message from ${senderName} - Job #${jobId}`,
    html,
    text,
  });
}

/**
 * Send job assignment notification to engineer
 */
export async function sendJobAssignmentNotification(options: {
  engineerEmail: string;
  engineerName: string;
  jobId: number;
  siteName: string;
  siteAddress: string;
  scheduledDateTime: Date;
  jobToken: string;
  baseUrl: string;
}) {
  const { APP_NAME, APP_URL, GMAIL_USER } = getGmailConfig();
  const { engineerEmail, engineerName, jobId, siteName, siteAddress, scheduledDateTime, jobToken, baseUrl } = options;

  const engineerJobUrl = `${baseUrl}/engineer/job/${jobToken}`;

  const emailBody = `
    <p>Hi ${engineerName},</p>
    <p>You have been assigned a new job on ${APP_NAME}:</p>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Job ID:</td><td style="padding: 8px; border: 1px solid #ddd;">${jobId}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Site:</td><td style="padding: 8px; border: 1px solid #ddd;">${siteName}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Address:</td><td style="padding: 8px; border: 1px solid #ddd;">${siteAddress}</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Scheduled:</td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(scheduledDateTime).toLocaleString()}</td></tr>
    </table>
    <p>Please review the job details and accept or decline the assignment by clicking the link below:</p>
    <p><a href="${engineerJobUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Job Details</a></p>
    <p>Thank you,<br/>The ${APP_NAME} Team</p>
  `;

  const subject = `New Job Assignment: #${jobId} - ${siteName}`;

  return await sendEmail({
    to: engineerEmail,
    from: `"${APP_NAME}" <${GMAIL_USER}>`,
    subject,
    html: emailBody,
  });
}
