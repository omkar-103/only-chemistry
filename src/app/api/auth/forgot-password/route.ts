// POST /api/auth/forgot-password
import { NextRequest } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { forgotPasswordSchema } from "@/lib/validators/schemas";
import { successResponse, errorResponse, rateLimit, getClientIP } from "@/lib/api/utils";
import { generateSecureOTP, storeOTP } from "@/lib/auth/otp";
import { sendOTPEmail } from "@/lib/email/emailService";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = rateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) return errorResponse("Too many requests. Please wait 15 minutes.", 429);

  try {
    const body = await req.json();
    const validation = forgotPasswordSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    const { email } = validation.data;
    await connectDB();

    const user = await User.findOne({ email }).lean();

    // Always return success to prevent email enumeration
    const successMsg = "If an account exists with this email, a password reset OTP has been sent.";

    if (!user) return successResponse({}, successMsg);
    if (!user.isVerified) return successResponse({}, successMsg);

    const otp = generateSecureOTP();
    await storeOTP(email, otp, "password_reset");
    await sendOTPEmail(email, otp, "password_reset", user.name);

    return successResponse({ email }, successMsg);
  } catch (error) {
    console.error("[FORGOT-PASSWORD] Error:", (error as Error).message);
    return errorResponse("Failed to process request. Please try again.", 500);
  }
}
