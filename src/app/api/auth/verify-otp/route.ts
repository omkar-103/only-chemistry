// POST /api/auth/verify-otp
import { NextRequest } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { otpVerifySchema } from "@/lib/validators/schemas";
import { successResponse, errorResponse, rateLimit, getClientIP } from "@/lib/api/utils";
import { verifyOTP } from "@/lib/auth/otp";
import Notification from "@/lib/db/models/Notification";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = rateLimit(`otp:${ip}`, 10, 15 * 60 * 1000);
  if (!allowed) return errorResponse("Too many OTP attempts. Wait 15 minutes.", 429);

  try {
    const body = await req.json();
    const validation = otpVerifySchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { email, otp } = validation.data;
    await connectDB();

    const user = await User.findOne({ email }).lean();
    if (!user) return errorResponse("No account found with this email", 404);
    if (user.isVerified) return successResponse({ email }, "Email already verified. Please log in.");

    const result = await verifyOTP(email, otp, "email_verify");
    if (!result.valid) return errorResponse(result.error || "Invalid OTP", 400);

    // Mark user as verified
    await User.findOneAndUpdate({ email }, { $set: { isVerified: true } });

    // Send verified notification
    await Notification.create({
      userId: user._id,
      type: "email_verified",
      title: "Email Verified Successfully!",
      message: "Your email has been verified. You can now access all features.",
    });

    return successResponse({ email }, "Email verified successfully! You can now log in.");
  } catch (error) {
    console.error("[VERIFY-OTP] Error:", (error as Error).message);
    return errorResponse("Verification failed. Please try again.", 500);
  }
}
