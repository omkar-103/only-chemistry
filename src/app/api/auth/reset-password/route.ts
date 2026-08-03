// POST /api/auth/reset-password
import { NextRequest } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { resetPasswordSchema } from "@/lib/validators/schemas";
import { successResponse, errorResponse, rateLimit, getClientIP, createAuditLog } from "@/lib/api/utils";
import { verifyOTP } from "@/lib/auth/otp";
import Notification from "@/lib/db/models/Notification";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = rateLimit(`reset:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) return errorResponse("Too many attempts. Please wait 15 minutes.", 429);

  try {
    const body = await req.json();
    const validation = resetPasswordSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    const { email, otp, password } = validation.data;
    await connectDB();

    const user = await User.findOne({ email }).lean();
    if (!user) return errorResponse("No account found with this email", 404);

    const result = await verifyOTP(email, otp, "password_reset");
    if (!result.valid) return errorResponse(result.error || "Invalid OTP", 400);

    // Update password — pre-save hook will hash it
    await User.findOneAndUpdate(
      { email },
      {
        $set: { password },
        // Invalidate all sessions
        $unset: { sessionToken: 1, sessionTokenExpiry: 1 },
      }
    );

    // Note: We need to use the model's save to trigger pre-save hook
    const userDoc = await User.findOne({ email }).select("+password");
    if (userDoc) {
      userDoc.password = password;
      await userDoc.save();
    }

    await Notification.create({
      userId: user._id,
      type: "password_changed",
      title: "Password Changed",
      message: "Your password was successfully changed. If this wasn't you, contact support immediately.",
    });

    await createAuditLog({
      userId: user._id.toString(),
      userEmail: email,
      action: "PASSWORD_RESET",
      resource: "User",
      ip,
      severity: "warning",
    });

    return successResponse({}, "Password reset successful! You can now log in with your new password.");
  } catch (error) {
    console.error("[RESET-PASSWORD] Error:", (error as Error).message);
    return errorResponse("Password reset failed. Please try again.", 500);
  }
}
