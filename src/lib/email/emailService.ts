// ============================================================
// Email Service — Mock (Dev) / Real (Prod)
// ============================================================
// In development: OTPs are logged to the console
// In production: Replace with real SMTP/email provider
// The interface is designed for easy swap-out

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
  error?: string;
}

/**
 * Send OTP Email (Mock in dev, Real in prod)
 */
export async function sendOTPEmail(
  to: string,
  otp: string,
  type: "email_verify" | "password_reset",
  name: string
): Promise<EmailResult> {
  const subject =
    type === "email_verify"
      ? "Verify Your Email — Only Chemistry"
      : "Password Reset OTP — Only Chemistry";

  const html = generateOTPEmailHTML(otp, type, name);

  return sendEmail({ to, subject, html });
}

/**
 * Core email sending function
 * Swap the implementation here when moving to production
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const isDev = process.env.NODE_ENV !== "production";
  const hasSmtpConfig =
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (isDev && !hasSmtpConfig) {
    // ── MOCK MODE ──────────────────────────────────────────
    console.log("\n" + "=".repeat(60));
    console.log("📧 [EMAIL SERVICE — DEMO MODE]");
    console.log("=".repeat(60));
    console.log(`To      : ${options.to}`);
    console.log(`Subject : ${options.subject}`);
    // Extract OTP from HTML for easy visibility
    const otpMatch = options.html.match(/\b\d{6}\b/);
    if (otpMatch) {
      console.log(`🔑 OTP  : ${otpMatch[0]}`);
    }
    console.log("=".repeat(60));
    console.log("💡 To use real email, add SMTP_* vars to .env.local");
    console.log("=".repeat(60) + "\n");

    return { success: true, messageId: `mock-${Date.now()}` };
  }

  // ── PRODUCTION MODE ──────────────────────────────────────
  // Replace with Nodemailer or any email provider
  try {
    const nodemailer = await import("nodemailer").catch(() => null);
    if (!nodemailer) {
      throw new Error("nodemailer not installed. Run: npm install nodemailer");
    }

    const transporter = nodemailer.default.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"${process.env.NEXT_PUBLIC_APP_NAME}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`✅ [EMAIL] Sent to ${options.to} — Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const err = error as Error;
    console.error(`❌ [EMAIL] Failed to send email: ${err.message}`);
    return { success: false, error: err.message };
  }
}

/**
 * Generate professional OTP email HTML
 */
function generateOTPEmailHTML(
  otp: string,
  type: "email_verify" | "password_reset",
  name: string
): string {
  const actionText =
    type === "email_verify"
      ? "verify your email address"
      : "reset your password";

  const warningText =
    type === "password_reset"
      ? "If you didn't request a password reset, please ignore this email and contact support immediately."
      : "If you didn't create an account, please ignore this email.";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${type === "email_verify" ? "Verify Email" : "Reset Password"}</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0a0f2c,#192a6c);padding:40px;text-align:center;">
              <h1 style="color:#d4af37;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Only Chemistry
              </h1>
              <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px;">
                Premier Chemistry Education Platform
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#0a0f2c;font-size:22px;margin:0 0 16px;">Hello, ${name}!</h2>
              <p style="color:#444;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Use the following One-Time Password (OTP) to ${actionText}. This code is valid for <strong>10 minutes</strong>.
              </p>
              <!-- OTP Box -->
              <div style="background:#f8f9fb;border:2px dashed #d4af37;border-radius:12px;padding:32px;text-align:center;margin:0 0 24px;">
                <p style="margin:0 0 8px;color:#666;font-size:14px;text-transform:uppercase;letter-spacing:2px;">Your OTP Code</p>
                <p style="margin:0;font-size:48px;font-weight:900;color:#0a0f2c;letter-spacing:12px;">${otp}</p>
              </div>
              <p style="color:#888;font-size:14px;line-height:1.6;margin:0 0 24px;">
                ${warningText}
              </p>
              <hr style="border:none;border-top:1px solid #eee;margin:0 0 24px;">
              <p style="color:#aaa;font-size:12px;margin:0;text-align:center;">
                © ${new Date().getFullYear()} Only Chemistry. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
