// ============================================================
// OTP Service — Secure Generation, Storage & Validation
// ============================================================

import crypto from "crypto";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { OTP_EXPIRY_MINUTES, OTP_MAX_ATTEMPTS } from "@/constants";

export type OTPType = "email_verify" | "password_reset";

/**
 * Generate a cryptographically secure 6-digit OTP
 */
export function generateSecureOTP(): string {
  // Use crypto.randomInt for uniform distribution
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Store OTP in the database for a user
 */
export async function storeOTP(
  email: string,
  otp: string,
  type: OTPType
): Promise<void> {
  await connectDB();

  const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");
  const expiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    {
      $set: {
        otp: hashedOTP,
        otpExpiry: expiry,
        otpAttempts: 0,
        otpType: type,
      },
    }
  );
}

/**
 * Verify OTP — returns true/false with descriptive error
 */
export async function verifyOTP(
  email: string,
  otp: string,
  type: OTPType
): Promise<{ valid: boolean; error?: string }> {
  await connectDB();

  const user = await User.findOne({ email: email.toLowerCase() })
    .select("+otp +otpExpiry +otpAttempts +otpType")
    .lean();

  if (!user) return { valid: false, error: "User not found" };
  if (!user.otp) return { valid: false, error: "No OTP was requested" };
  if (user.otpType !== type) return { valid: false, error: "Invalid OTP type" };

  // Check expiry
  if (!user.otpExpiry || new Date() > user.otpExpiry) {
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $unset: { otp: 1, otpExpiry: 1, otpAttempts: 1, otpType: 1 } }
    );
    return { valid: false, error: "OTP has expired. Please request a new one." };
  }

  // Check max attempts
  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $unset: { otp: 1, otpExpiry: 1, otpAttempts: 1, otpType: 1 } }
    );
    return {
      valid: false,
      error: "Too many failed attempts. Please request a new OTP.",
    };
  }

  // Verify hash
  const hashedInput = crypto.createHash("sha256").update(otp).digest("hex");
  if (hashedInput !== user.otp) {
    await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      { $inc: { otpAttempts: 1 } }
    );
    const remaining = OTP_MAX_ATTEMPTS - (user.otpAttempts + 1);
    return {
      valid: false,
      error: `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    };
  }

  // OTP is valid — clear it
  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $unset: { otp: 1, otpExpiry: 1, otpAttempts: 1, otpType: 1 } }
  );

  return { valid: true };
}

/**
 * Clear any existing OTP for a user (e.g., on new request)
 */
export async function clearOTP(email: string): Promise<void> {
  await connectDB();
  await User.findOneAndUpdate(
    { email: email.toLowerCase() },
    { $unset: { otp: 1, otpExpiry: 1, otpAttempts: 1, otpType: 1 } }
  );
}
