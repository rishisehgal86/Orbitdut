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
  const { APP_URL, GMAIL_USER } = getGmailConfig();
  const APP_NAME = "Orbidut";
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
    subject,
    html: emailBody,
  });
}

/**
 * Send supplier verification approved email
 */
export async function sendVerificationApprovedEmail(
  email: string,
  companyName: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const dashboardUrl = `${APP_URL}/supplier/dashboard`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Approved</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Orbidut</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">🎉 Verification Approved!</h2>
    
    <p>Congratulations ${companyName}!</p>
    
    <p>Your supplier verification has been <strong style="color: #10b981;">approved</strong>. You can now start accepting jobs on the Orbidut marketplace.</p>
    
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46;"><strong>What's Next?</strong></p>
      <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #065f46;">
        <li>Complete your rate configuration</li>
        <li>Set your geographic coverage</li>
        <li>Start accepting job requests</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Go to Dashboard</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">Welcome to the Orbidut supplier network! We're excited to have you on board.</p>
    
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
Verification Approved!

Congratulations ${companyName}!

Your supplier verification has been approved. You can now start accepting jobs on the Orbidut marketplace.

What's Next?
- Complete your rate configuration
- Set your geographic coverage
- Start accepting job requests

Go to Dashboard: ${dashboardUrl}

Welcome to the Orbidut supplier network! We're excited to have you on board.

---
Orbidut - Connect with Trusted Service Providers Instantly
Visit: ${APP_URL}
`;

  return sendEmail({
    to: email,
    subject: "✅ Your Orbidut Verification Has Been Approved",
    html,
    text,
  });
}

/**
 * Send supplier verification rejected email
 */
export async function sendVerificationRejectedEmail(
  email: string,
  companyName: string,
  rejectionReason: string,
  adminNotes?: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const verificationUrl = `${APP_URL}/supplier/verification`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verification Update Required</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Orbidut</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Verification Update Required</h2>
    
    <p>Hi ${companyName},</p>
    
    <p>Thank you for submitting your supplier verification. After reviewing your application, we need you to address the following items before we can approve your account:</p>
    
    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #991b1b;"><strong>Reason:</strong></p>
      <p style="margin: 0; color: #7f1d1d;">${rejectionReason}</p>
      ${adminNotes ? `<p style="margin: 15px 0 0 0; color: #7f1d1d;"><strong>Additional Notes:</strong><br>${adminNotes}</p>` : ''}
    </div>
    
    <p>Please update your verification documents and resubmit your application.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Update Verification</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">If you have any questions, please don't hesitate to contact our support team.</p>
    
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
Verification Update Required

Hi ${companyName},

Thank you for submitting your supplier verification. After reviewing your application, we need you to address the following items before we can approve your account:

Reason: ${rejectionReason}
${adminNotes ? `\nAdditional Notes: ${adminNotes}` : ''}

Please update your verification documents and resubmit your application.

Update Verification: ${verificationUrl}

If you have any questions, please don't hesitate to contact our support team.

---
Orbidut - Connect with Trusted Service Providers Instantly
Visit: ${APP_URL}
`;

  return sendEmail({
    to: email,
    subject: "Action Required: Update Your Orbidut Verification",
    html,
    text,
  });
}

/**
 * Send welcome email to new supplier
 */
export async function sendSupplierWelcomeEmail(
  email: string,
  name: string,
  companyName: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const verificationUrl = `${APP_URL}/supplier/verification`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Orbidut</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Orbidut!</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <p>Hi ${name},</p>
    
    <p>Thank you for joining Orbidut as a service provider! We're excited to have <strong>${companyName}</strong> in our network.</p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;"><strong>⚠️ Next Step: Complete Your Verification</strong></p>
      <p style="margin: 10px 0 0 0; color: #92400e;">Before you can start accepting jobs, you need to complete the supplier verification process.</p>
    </div>
    
    <p><strong>What you'll need:</strong></p>
    <ul style="color: #4b5563;">
      <li>Company profile information</li>
      <li>Insurance certificates (Liability, Indemnity, Workers Comp)</li>
      <li>Signed legal documents (DPA, NDA, Non-Compete)</li>
    </ul>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Complete Verification →</a>
    </div>
    
    <p><strong>What happens next?</strong></p>
    <ol style="color: #4b5563;">
      <li>Complete your company profile</li>
      <li>Upload required documents</li>
      <li>Submit for admin review</li>
      <li>Get approved and start accepting jobs!</li>
    </ol>
    
    <p style="color: #6b7280; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
    
    <p>Best regards,<br/>
    The Orbidut Team</p>
    
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
Welcome to Orbidut!

Hi ${name},

Thank you for joining Orbidut as a service provider! We're excited to have ${companyName} in our network.

⚠️ Next Step: Complete Your Verification
Before you can start accepting jobs, you need to complete the supplier verification process.

What you'll need:
- Company profile information
- Insurance certificates (Liability, Indemnity, Workers Comp)
- Signed legal documents (DPA, NDA, Non-Compete)

Complete Verification: ${verificationUrl}

What happens next?
1. Complete your company profile
2. Upload required documents
3. Submit for admin review
4. Get approved and start accepting jobs!

If you have any questions, feel free to reach out to our support team.

Best regards,
The Orbidut Team

---
Orbidut - Connect with Trusted Service Providers Instantly
Visit: ${APP_URL}
`;

  return sendEmail({
    to: email,
    subject: "Welcome to Orbidut - Complete Your Verification",
    html,
    text,
  });
}
