import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Always resolve .env relative to this file so it works from any CWD
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an approval email to a user after admin approves their account.
 */
export async function sendApprovalEmail(email, fullName, stokvelNames = []) {
  const loginUrl = `${FRONTEND_URL}/login`;

  const stokvelList = stokvelNames.length > 0
    ? `<p style="margin:0 0 8px"><strong>You've been assigned to:</strong></p>
       <ul style="margin:0 0 16px;padding-left:20px;color:#374151;">
         ${stokvelNames.map(n => `<li>${n}</li>`).join('')}
       </ul>`
    : '';

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Account Approved! ✅</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        Hi <strong>${fullName}</strong>,
      </p>
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        Great news! Your account has been reviewed and <strong style="color:#16a34a;">approved</strong> by our admin team. You can now log in and start contributing to your stokvel.
      </p>

      ${stokvelList}

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.5px;">
          Log In Now
        </a>
      </div>

      <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 24px;word-break:break-all;">
        <a href="${loginUrl}" style="color:#16a34a;font-size:14px;">${loginUrl}</a>
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

      <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
        If you did not register for this account, please ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        &copy; ${new Date().getFullYear()} Stokvel Management System. All rights reserved.
      </p>
    </div>
  </div>`;

  const mailOptions = {
    from: `"Stokvel Management" <${process.env.SMTP_USER || 'noreply@stokvel.co.za'}>`,
    to: email,
    subject: '🎉 Your Account Has Been Approved!',
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Approval email sent to ${email}`);
  } catch (err) {
    // Log but don't throw — email failure shouldn't block the approval flow
    console.error(`⚠️  Failed to send approval email to ${email}:`, err.message);
  }
}

/**
 * Send an email when a join request is approved.
 */
export async function sendJoinRequestApprovedEmail(email, fullName, stokvelName) {
  const loginUrl = `${FRONTEND_URL}/login`;

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Welcome to ${stokvelName}! 🎉</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        Hi <strong>${fullName}</strong>,
      </p>
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        Your request to join <strong style="color:#2563eb;">${stokvelName}</strong> has been approved! You're now a member and can start contributing.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.5px;">
          Log In & Start Contributing
        </a>
      </div>

      <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 24px;word-break:break-all;">
        <a href="${loginUrl}" style="color:#2563eb;font-size:14px;">${loginUrl}</a>
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

      <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
        If you did not request to join this stokvel, please ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        &copy; ${new Date().getFullYear()} Stokvel Management System. All rights reserved.
      </p>
    </div>
  </div>`;

  const mailOptions = {
    from: `"Stokvel Management" <${process.env.SMTP_USER || 'noreply@stokvel.co.za'}>`,
    to: email,
    subject: `🎉 You've been added to ${stokvelName}!`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Join-approved email sent to ${email}`);
  } catch (err) {
    console.error(`⚠️  Failed to send join-approved email to ${email}:`, err.message);
  }
}

/**
 * Send an email when admin assigns a user to a stokvel.
 */
export async function sendStokvelAssignmentEmail(email, fullName, stokvelNames = []) {
  const loginUrl = `${FRONTEND_URL}/login`;

  const stokvelList = stokvelNames.map(n => `<li style="margin-bottom:4px;">${n}</li>`).join('');

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#2563eb,#1d4ed8);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">New Stokvel Assignment! 🎉</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        Hi <strong>${fullName}</strong>,
      </p>
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        You have been assigned to ${stokvelNames.length === 1 ? 'a new stokvel' : 'new stokvels'} by the admin. You can now start contributing!
      </p>

      <p style="margin:0 0 8px;font-weight:600;color:#374151;">You've been added to:</p>
      <ul style="margin:0 0 24px;padding-left:20px;color:#374151;font-size:15px;">
        ${stokvelList}
      </ul>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.5px;">
          Log In & View Dashboard
        </a>
      </div>

      <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
        Or copy and paste this link into your browser:
      </p>
      <p style="margin:0 0 24px;word-break:break-all;">
        <a href="${loginUrl}" style="color:#2563eb;font-size:14px;">${loginUrl}</a>
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

      <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
        If you have questions about this assignment, please contact your admin.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        &copy; ${new Date().getFullYear()} Stokvel Management System. All rights reserved.
      </p>
    </div>
  </div>`;

  const mailOptions = {
    from: `"Stokvel Management" <${process.env.SMTP_USER || 'noreply@stokvel.co.za'}>`,
    to: email,
    subject: `🎉 You've been assigned to ${stokvelNames.length === 1 ? stokvelNames[0] : 'new stokvels'}!`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Stokvel assignment email sent to ${email}`);
  } catch (err) {
    console.error(`⚠️  Failed to send stokvel assignment email to ${email}:`, err.message);
  }
}

/**
 * Send an email when admin removes a user from a stokvel.
 */
export async function sendStokvelUnassignmentEmail(email, fullName, stokvelNames = []) {
  const loginUrl = `${FRONTEND_URL}/login`;

  const stokvelList = stokvelNames.map(n => `<li style="margin-bottom:4px;">${n}</li>`).join('');

  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Stokvel Membership Update</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        Hi <strong>${fullName}</strong>,
      </p>
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        We're writing to let you know that you have been removed from the following stokvel${stokvelNames.length > 1 ? 's' : ''} by the admin:
      </p>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:0 0 24px;">
        <ul style="margin:0;padding-left:20px;color:#991b1b;font-size:15px;">
          ${stokvelList}
        </ul>
      </div>

      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        If you believe this was done in error, please contact the admin or reach out to our support team.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${loginUrl}" style="display:inline-block;background:#374151;color:#ffffff;text-decoration:none;padding:14px 40px;border-radius:8px;font-size:16px;font-weight:600;letter-spacing:0.5px;">
          Log In to Your Account
        </a>
      </div>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

      <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
        This is an automated notification from the Stokvel Management System.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        &copy; ${new Date().getFullYear()} Stokvel Management System. All rights reserved.
      </p>
    </div>
  </div>`;

  const mailOptions = {
    from: `"Stokvel Management" <${process.env.SMTP_USER || 'noreply@stokvel.co.za'}>`,
    to: email,
    subject: `Stokvel Membership Removed — ${stokvelNames.join(', ')}`,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Stokvel unassignment email sent to ${email}`);
  } catch (err) {
    console.error(`⚠️  Failed to send stokvel unassignment email to ${email}:`, err.message);
  }
}

/**
 * Send a password reset code via email.
 */
export async function sendPasswordResetEmail(email, code) {
  const html = `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Password Reset 🔐</h1>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="margin:0 0 16px;color:#374151;font-size:16px;">
        We received a request to reset your password. Use the verification code below to proceed:
      </p>

      <!-- Code Box -->
      <div style="text-align:center;margin:32px 0;">
        <div style="display:inline-block;background:#f3f4f6;border:2px dashed #d1d5db;border-radius:12px;padding:20px 40px;">
          <p style="margin:0 0 4px;color:#6b7280;font-size:13px;font-weight:500;text-transform:uppercase;letter-spacing:1px;">Verification Code</p>
          <p style="margin:0;color:#111827;font-size:36px;font-weight:700;letter-spacing:8px;">${code}</p>
        </div>
      </div>

      <p style="margin:0 0 16px;color:#374151;font-size:14px;">
        This code will expire in <strong>15 minutes</strong>. If you didn't request a password reset, you can safely ignore this email.
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

      <p style="margin:0;color:#9ca3af;font-size:13px;text-align:center;">
        ⚠️ Never share this code with anyone. Our team will never ask for it.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        &copy; ${new Date().getFullYear()} Stokvel Management System. All rights reserved.
      </p>
    </div>
  </div>`;

  const mailOptions = {
    from: `"Stokvel Management" <${process.env.SMTP_USER || 'noreply@stokvel.co.za'}>`,
    to: email,
    subject: '🔐 Password Reset Code',
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Password reset email sent to ${email}`);
  } catch (err) {
    console.error(`⚠️  Failed to send password reset email to ${email}:`, err.message);
  }
}
