// POST /api/auth/register
import { NextRequest } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { registerSchema } from "@/lib/validators/schemas";
import { successResponse, errorResponse, rateLimit, getClientIP, createAuditLog } from "@/lib/api/utils";
import { generateSecureOTP, storeOTP } from "@/lib/auth/otp";
import { sendOTPEmail } from "@/lib/email/emailService";
import { sendWelcomeEmail } from "@/lib/email/sendWelcomeEmail";
import Notification from "@/lib/db/models/Notification";

const IS_DEV = process.env.NODE_ENV !== "production";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed } = rateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
  if (!allowed) {
    return errorResponse("Too many registration attempts. Please try again later.", 429);
  }

  try {
    const body = await req.json();
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400, "Validation failed");
    }

    const { name, email, mobile, password } = validation.data;
    await connectDB();

    const existingUser = await User.findOne({ email }).lean();
    if (existingUser) {
      if (existingUser.isVerified) {
        return errorResponse("An account with this email already exists", 409);
      } else {
        const otp = generateSecureOTP();
        await storeOTP(email, otp, "email_verify");

        if (IS_DEV) {
          console.log(`\n📧 [DEV] OTP for ${email}: ${otp}\n`);
        } else {
          await sendOTPEmail(email, otp, "email_verify", existingUser.name);
        }

        return successResponse({ email },
          IS_DEV
            ? `Account not verified. DEV MODE: OTP is ${otp} (also printed in server console).`
            : "Account already exists but not verified. A new OTP has been sent to your email.",
          200
        );
      }
    }

    // In dev mode — auto-verify new registrations (skip email OTP)
    const user = await User.create({
      name,
      email,
      mobile,
      password,
      isVerified: IS_DEV ? true : false,
    });

    // ── Send welcome email — NON-BLOCKING ──────────────────────────
    // Called only after MongoDB user creation succeeds.
    // Failure to send does NOT fail or roll back registration.
    sendWelcomeEmail(name, email).catch(() => {
      // Already logged inside sendWelcomeEmail — safe to swallow here
    });
    // ──────────────────────────────────────────────────────────────

    if (!IS_DEV) {
      // Production: send OTP email
      const otp = generateSecureOTP();
      await storeOTP(email, otp, "email_verify");
      const emailResult = await sendOTPEmail(email, otp, "email_verify", name);
      await createAuditLog({
        userId: user._id.toString(), userName: name, userEmail: email,
        action: "REGISTER", resource: "User", resourceId: user._id.toString(),
        ip, details: { emailSent: emailResult.success },
      });

      await Notification.create({
        userId: user._id,
        type: "registration",
        title: "Welcome to Only Chemistry!",
        message: "Your account has been created. Please verify your email to get started.",
      });

      return successResponse({ email, name },
        "Registration successful! Please check your email for the verification OTP.", 201);
    }

    // Dev mode: auto-verified → user can login immediately
    await Notification.create({
      userId: user._id,
      type: "registration",
      title: "Welcome to Only Chemistry!",
      message: "Your account is ready. Start exploring exams!",
    }).catch(() => {});

    await createAuditLog({
      userId: user._id.toString(), userName: name, userEmail: email,
      action: "REGISTER", resource: "User", resourceId: user._id.toString(), ip,
    }).catch(() => {});

    return successResponse(
      { email, name, autoVerified: true },
      "Registration successful! You can now log in directly.",
      201
    );
  } catch (error) {
    const err = error as Error;
    console.error("[REGISTER] Error:", err.message);
    if (err.message.includes("E11000")) {
      return errorResponse("An account with this email already exists", 409);
    }
    return errorResponse("Registration failed. Please try again.", 500);
  }
}
