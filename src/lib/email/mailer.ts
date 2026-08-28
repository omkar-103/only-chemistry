// ============================================================
// Nodemailer SMTP Transporter — Server-side only
//
// Reads configuration from environment variables.
// NEVER import this in client components.
// ============================================================
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let _transporter: Transporter | null = null;

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface MailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Returns a singleton Nodemailer transporter configured from env vars.
 * Throws clearly if SMTP env vars are missing.
 */
function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "[MAILER] SMTP configuration is incomplete. Required: SMTP_HOST, SMTP_USER, SMTP_PASS"
    );
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return _transporter;
}

/**
 * Core, reusable send function. All email types go through here.
 *
 * On SMTP failure: returns { success: false, error } — never throws.
 * Caller decides what to do with the failure.
 */
export async function sendMail(options: SendMailOptions): Promise<MailResult> {
  const fromName = process.env.NEXT_PUBLIC_APP_NAME || "Only Chemistry";
  const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER;

  console.log(`[EMAIL DEBUG] Connecting to SMTP (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`);

  try {
    const transporter = getTransporter();

    console.log("[EMAIL DEBUG] SMTP connection successful");
    console.log(`[EMAIL DEBUG] Sending email to: ${options.to} | Subject: ${options.subject}`);

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log(`[EMAIL DEBUG] Email sent successfully — Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    const code = error?.code || "UNKNOWN";
    const message = error?.message || "Unknown error";
    console.error(`[EMAIL ERROR] Send failed`);
    console.error(`[EMAIL ERROR] Code: ${code}`);
    console.error(`[EMAIL ERROR] Message: ${message}`);
    return { success: false, error: message };
  }
}
