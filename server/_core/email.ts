import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Get Gmail configuration from environment variables
 */
function getGmailConfig() {
  return {
    GMAIL_USER: process.env.GMAIL_USER || "",
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD || "",
    FROM_EMAIL: process.env.GMAIL_USER || "noreply@orbidut.com",
    APP_URL: process.env.VITE_APP_URL || "http://localhost:3000",
    APP_NAME: "Orbidut",
  };
}

/**
 * Create Gmail transporter
 */
function getTransporter() {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = getGmailConfig();
  
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn("Gmail credentials not configured");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
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
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
    });

    console.log("Email sent successfully:", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

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
    
    <p>We received a request to reset your Orbidut password. Click the button below to create a new password:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Reset Password</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour for security reasons.</p>
    
    <p style="color: #6b7280; font-size: 14px;">If you didn't request this password reset, you can safely ignore this email.</p>
    
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

We received a request to reset your Orbidut password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request this password reset, you can safely ignore this email.

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
  jobId: number,
  status: string,
  customerName: string,
  siteAddress: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const jobUrl = `${APP_URL}/customer/jobs/${jobId}`;

  const statusLabels: Record<string, string> = {
    pending_supplier_acceptance: "Pending Supplier Acceptance",
    supplier_accepted: "Accepted by Supplier",
    sent_to_engineer: "Sent to Engineer",
    engineer_accepted: "Engineer Assigned",
    en_route: "Engineer En Route",
    on_site: "Engineer On Site",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const statusLabel = statusLabels[status] || status;

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
      <p style="margin: 0 0 10px 0;"><strong>Location:</strong> ${siteAddress}</p>
      <p style="margin: 0;"><strong>Status:</strong> <span style="color: #667eea; font-weight: 600;">${statusLabel}</span></p>
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
Location: ${siteAddress}
Status: ${statusLabel}

View Job Details: ${jobUrl}

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
  jobId: number,
  senderName: string,
  messagePreview: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const jobUrl = `${APP_URL}/customer/jobs/${jobId}`;

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
    
    <p>You have a new message from <strong>${senderName}</strong> regarding Job #${jobId}:</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <p style="margin: 0; color: #4b5563;">${messagePreview}</p>
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

You have a new message from ${senderName} regarding Job #${jobId}:

"${messagePreview}"

View Message: ${jobUrl}

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
export async function sendJobAssignmentNotification(
  engineerEmail: string,
  engineerName: string,
  jobId: number,
  siteName: string,
  siteAddress: string,
  scheduledDate: string,
  engineerToken: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const jobUrl = `${APP_URL}/engineer/job/${engineerToken}`;

  const emailBody = `
    <h2>New Job Assignment</h2>
    <p>Hi ${engineerName},</p>
    <p>You have been assigned to a new job:</p>
    <ul>
      <li><strong>Job ID:</strong> #${jobId}</li>
      <li><strong>Site:</strong> ${siteName}</li>
      <li><strong>Address:</strong> ${siteAddress}</li>
      <li><strong>Scheduled:</strong> ${scheduledDate}</li>
    </ul>
    <p><a href="${jobUrl}">Click here to view job details and accept</a></p>
    <p>Thank you,<br/>The ${getGmailConfig().APP_NAME} Team</p>
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
  const jobsUrl = `${APP_URL}/supplier/jobs`;

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
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="background: #10b981; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <span style="color: white; font-size: 48px;">✓</span>
      </div>
      <h2 style="color: #1f2937; margin: 0;">Verification Approved!</h2>
    </div>
    
    <p>Congratulations ${companyName}!</p>
    
    <p>Your supplier verification has been approved. You can now start receiving and accepting job requests from customers on the Orbidut platform.</p>
    
    <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #065f46;"><strong>What's Next?</strong></p>
      <ul style="margin: 0; padding-left: 20px; color: #065f46;">
        <li>Browse available jobs in your area</li>
        <li>Accept jobs that match your expertise</li>
        <li>Assign engineers to accepted jobs</li>
        <li>Track job progress in real-time</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${jobsUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin: 0 10px 10px 0;">View Available Jobs</a>
      <a href="${dashboardUrl}" style="background: #6b7280; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin: 0 10px 10px 0;">Go to Dashboard</a>
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
Verification Approved!

Congratulations ${companyName}!

Your supplier verification has been approved. You can now start receiving and accepting job requests from customers on the Orbidut platform.

What's Next?
- Browse available jobs in your area
- Accept jobs that match your expertise
- Assign engineers to accepted jobs
- Track job progress in real-time

View Available Jobs: ${jobsUrl}
Go to Dashboard: ${dashboardUrl}

If you have any questions, please don't hesitate to contact our support team.

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
 * Send resubmission required email
 */
export async function sendVerificationResubmissionEmail(
  email: string,
  companyName: string,
  feedback: string,
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
  <title>Resubmission Required</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Orbidut</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Additional Information Needed</h2>
    
    <p>Hi ${companyName},</p>
    
    <p>Thank you for your verification submission. We've reviewed your application and need some additional information or updated documents before we can proceed with approval.</p>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #92400e;"><strong>What We Need:</strong></p>
      <p style="margin: 0; color: #78350f;">${feedback}</p>
      ${adminNotes ? `<p style="margin: 15px 0 0 0; color: #78350f;"><strong>Additional Notes:</strong><br>${adminNotes}</p>` : ''}
    </div>
    
    <p>Please review the feedback above and update your application with the requested information. Once you resubmit, we'll review it promptly.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">Update Application</a>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">If you have any questions about what's needed, please don't hesitate to contact our support team.</p>
    
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
Additional Information Needed

Hi ${companyName},

Thank you for your verification submission. We've reviewed your application and need some additional information or updated documents before we can proceed with approval.

What We Need: ${feedback}
${adminNotes ? `\nAdditional Notes: ${adminNotes}` : ''}

Please review the feedback above and update your application with the requested information. Once you resubmit, we'll review it promptly.

Update Application: ${verificationUrl}

If you have any questions about what's needed, please don't hesitate to contact our support team.

---
Orbidut - Connect with Trusted Service Providers Instantly
Visit: ${APP_URL}
`;

  return sendEmail({
    to: email,
    subject: "📋 Additional Information Needed for Your Verification",
    html,
    text,
  });
}

/**
 * Send welcome email to new supplier
 */
export async function sendSupplierWelcomeEmail(
  email: string,
  companyName: string,
  userName: string
): Promise<boolean> {
  const { APP_URL } = getGmailConfig();
  const verificationUrl = `${APP_URL}/supplier/verification`;
  const dashboardUrl = `${APP_URL}/supplier/dashboard`;

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
    <h1 style="color: white; margin: 0; font-size: 28px;">Orbidut</h1>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Welcome to Orbidut!</h2>
    
    <p>Hi ${userName},</p>
    
    <p>Thank you for joining Orbidut as a service provider! We're excited to have ${companyName} on our platform.</p>
    
    <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
      <p style="margin: 0 0 10px 0; color: #1e40af;"><strong>Next Steps:</strong></p>
      <ol style="margin: 0; padding-left: 20px; color: #1e3a8a;">
        <li style="margin-bottom: 8px;">Complete your supplier verification (required)</li>
        <li style="margin-bottom: 8px;">Upload required documents and insurance certificates</li>
        <li style="margin-bottom: 8px;">Wait for admin approval (typically 1-2 business days)</li>
        <li style="margin-bottom: 8px;">Start receiving and accepting job requests!</li>
      </ol>
    </div>
    
    <p>To get started, please complete your verification by uploading your company documents and insurance certificates. This helps us maintain quality and trust on our platform.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin: 0 10px 10px 0;">Start Verification</a>
      <a href="${dashboardUrl}" style="background: #6b7280; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin: 0 10px 10px 0;">Go to Dashboard</a>
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
Welcome to Orbidut!

Hi ${userName},

Thank you for joining Orbidut as a service provider! We're excited to have ${companyName} on our platform.

Next Steps:
1. Complete your supplier verification (required)
2. Upload required documents and insurance certificates
3. Wait for admin approval (typically 1-2 business days)
4. Start receiving and accepting job requests!

To get started, please complete your verification by uploading your company documents and insurance certificates. This helps us maintain quality and trust on our platform.

Start Verification: ${verificationUrl}
Go to Dashboard: ${dashboardUrl}

If you have any questions, please don't hesitate to contact our support team.

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
