// POST /api/auth/login
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { loginSchema } from "@/lib/validators/schemas";
import { successResponse, errorResponse, rateLimit, getClientIP, createAuditLog } from "@/lib/api/utils";
import { generateAccessToken, generateRefreshToken, generateSessionToken } from "@/lib/auth/jwt";
import { parseUserAgent } from "@/lib/utils/userAgent";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);
  const { allowed, remaining } = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return errorResponse("Too many login attempts. Please wait 15 minutes.", 429);
  }

  try {
    const body = await req.json();
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse(validation.error.issues[0].message, 400);
    }

    const { email, password } = validation.data;
    await connectDB();

    // Fetch user with password
    const user = await User.findOne({ email }).select("+password +sessionToken");
    if (!user) {
      console.error(`[LOGIN] ❌ No user found for email: ${email}`);
      return errorResponse("Invalid email or password", 401);
    }

    // Check if account is active
    if (!user.isActive) {
      console.error(`[LOGIN] ❌ Account inactive: ${email}`);
      return errorResponse("Your account has been suspended. Please contact support.", 403);
    }

    // Check email verification
    if (!user.isVerified) {
      console.error(`[LOGIN] ❌ Email not verified: ${email}`);
      return errorResponse(
        "Email not verified. Please verify your email before logging in.",
        403
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.error(`[LOGIN] ❌ Wrong password for: ${email}`);
      await createAuditLog({
        userId: user._id.toString(),
        action: "LOGIN_FAILED",
        resource: "User",
        ip,
        severity: "warning",
        details: { reason: "Invalid password" },
      });
      return errorResponse("Invalid email or password", 401);
    }

    // Generate new session token (invalidates previous session)
    const sessionToken = generateSessionToken();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Parse device info
    const userAgent = req.headers.get("user-agent") || "";
    const deviceInfo = parseUserAgent(userAgent, ip);

    // Update user: set new session, lastLogin, deviceInfo
    const now = new Date();
    await User.findByIdAndUpdate(user._id, {
      $set: {
        sessionToken,
        sessionTokenExpiry: sessionExpiry,
        lastLogin: now,
        lastActive: now,
        lastActiveAt: now,
        deviceInfo,
      },
    });

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sessionToken,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    await createAuditLog({
      userId: user._id.toString(),
      userName: user.name,
      userEmail: user.email,
      action: "LOGIN",
      resource: "User",
      ip,
      userAgent,
    });

    const assigned = Array.from(
      new Set([
        ...(user.assignedExams || []),
        ...(user.assignedCategories || []),
      ])
    );

    // Build response with httpOnly cookie for refresh token
    const response = NextResponse.json({
      success: true,
      message: "Login successful!",
      data: {
        accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          avatar: user.avatar,
          purchasedExams: user.purchasedExams || [],
          assignedExams: assigned,
          assignedCategories: assigned,
          lastActive: now.toISOString(),
          lastActiveAt: now.toISOString(),
        },
      },
    });

    // Set refresh token as httpOnly cookie (7 days)
    response.cookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    // Set access token cookie — also 7 days so browser refresh doesn't lose it.
    // Real security is the server-side sessionToken check in requireAuth/verifyAccessToken.
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[LOGIN] Error:", (error as Error).message);
    return errorResponse("Login failed. Please try again.", 500);
  }
}
