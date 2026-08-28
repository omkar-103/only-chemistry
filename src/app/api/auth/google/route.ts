// ============================================================
// POST /api/auth/google
//
// Google Sign-In backend endpoint.
//
// Flow:
//   1. Receive Firebase ID token from client
//   2. Verify it server-side (signature + claims)
//   3. Look up the verified email in MongoDB Atlas
//   4a. Found   → create session/JWT, return same shape as /api/auth/login
//   4b. Not found → 404 — NEVER auto-create a MongoDB user
//
// This enforces: "Google only authenticates an already-registered account."
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { verifyFirebaseIdToken } from "@/lib/firebase/verifyIdToken";
import {
  errorResponse,
  rateLimit,
  getClientIP,
  createAuditLog,
} from "@/lib/api/utils";
import {
  generateAccessToken,
  generateRefreshToken,
  generateSessionToken,
} from "@/lib/auth/jwt";
import { parseUserAgent } from "@/lib/utils/userAgent";

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  // Rate-limit by IP — same window as regular login route
  const { allowed } = rateLimit(`google-login:${ip}`, 10, 15 * 60 * 1000);
  if (!allowed) {
    return errorResponse(
      "Too many login attempts. Please wait 15 minutes.",
      429
    );
  }

  try {
    const body = await req.json();
    const { idToken } = body as { idToken?: string };

    if (!idToken || typeof idToken !== "string") {
      return errorResponse("Firebase ID token is required.", 400);
    }

    // ── Step 1: Verify the Firebase ID token on the server ─────
    let firebaseUser;
    try {
      firebaseUser = await verifyFirebaseIdToken(idToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Token verification failed.";
      console.error("[GOOGLE-LOGIN] Token verification failed:", msg);
      return errorResponse(
        msg || "Google authentication failed. Please try signing in again.",
        401
      );
    }

    await connectDB();

    const normalizedEmail = firebaseUser.email.toLowerCase().trim();

    // ── Step 2: Find the user in MongoDB by verified email ──────
    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+sessionToken");

    // ── Step 3: Reject if no MongoDB account exists ─────────────
    // Google authentication does NOT create accounts automatically.
    // Registration must be done manually via the /register page.
    if (!user) {
      console.warn(
        `[GOOGLE-LOGIN] No MongoDB account found for verified email: ${normalizedEmail}`
      );
      return errorResponse(
        "No account found. Please register first.",
        404
      );
    }

    // Guard: inactive account
    if (!user.isActive) {
      return errorResponse(
        "Your account has been suspended. Please contact support.",
        403
      );
    }

    // Guard: unverified account (if pending email verification)
    if (!user.isVerified) {
      // Auto-verify if they signed in with verified Google email, or prompt verification
      user.isVerified = true;
      await user.save();
    }

    // ── Step 4: Create session token (invalidates previous session) ─
    const sessionToken = generateSessionToken();
    const sessionExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const userAgent = req.headers.get("user-agent") ?? "";
    const deviceInfo = parseUserAgent(userAgent, ip);

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

    // ── Step 5: Generate JWT access + refresh tokens ─────────────
    const tokenPayload = {
      userId:       user._id.toString(),
      email:        user.email,
      role:         user.role,
      sessionToken,
    };

    const accessToken  = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // ── Step 6: Audit log ─────────────────────────────────────────
    await createAuditLog({
      userId:    user._id.toString(),
      userName:  user.name,
      userEmail: user.email,
      action:    "LOGIN",
      resource:  "User",
      ip,
      userAgent,
      details:   { method: "google", googleUid: firebaseUser.uid },
    }).catch(() => {});

    const assigned = Array.from(
      new Set([
        ...(user.assignedExams || []),
        ...(user.assignedCategories || []),
      ])
    );

    // ── Step 7: Build response — identical shape to /api/auth/login ─
    const response = NextResponse.json({
      success: true,
      message: "Google login successful!",
      data: {
        accessToken,
        user: {
          _id:                user._id,
          name:               user.name,
          email:              user.email,
          mobile:             user.mobile,
          role:               user.role,
          avatar:             user.avatar,
          purchasedExams:     user.purchasedExams     ?? [],
          assignedExams:      assigned,
          assignedCategories: assigned,
          lastActive:         now.toISOString(),
          lastActiveAt:       now.toISOString(),
        },
      },
    });

    // Set same httpOnly cookies as regular login
    const cookieOpts = {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge:   7 * 24 * 60 * 60,
      path:     "/",
    };

    response.cookies.set("refresh_token", refreshToken, cookieOpts);
    response.cookies.set("access_token",  accessToken,  cookieOpts);

    return response;
  } catch (error) {
    console.error("[GOOGLE-LOGIN] Unexpected error:", (error as Error).message);
    return errorResponse("Google login failed. Please try again.", 500);
  }
}
