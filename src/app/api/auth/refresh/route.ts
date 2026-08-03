// POST /api/auth/refresh
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from "@/lib/auth/jwt";
import { successResponse, errorResponse } from "@/lib/api/utils";

export async function POST(req: NextRequest) {
  try {
    const refreshToken =
      req.cookies.get("refresh_token")?.value ||
      (await req.json().catch(() => ({})))?.refreshToken;

    if (!refreshToken) {
      return errorResponse("Refresh token not found. Please log in.", 401);
    }

    const decoded = verifyRefreshToken(refreshToken);

    await connectDB();
    const user = await User.findById(decoded.userId)
      .select("+sessionToken")
      .lean();

    if (!user || !user.isActive) {
      return errorResponse("User not found or account suspended.", 401);
    }

    // Validate session token matches
    if (user.sessionToken !== decoded.sessionToken) {
      return errorResponse("Session expired. Please log in again.", 401);
    }

    // Issue new access token with same session
    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      sessionToken: decoded.sessionToken,
    };

    const newAccessToken  = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload); // rotate refresh token

    // Update lastLogin so session monitoring stays fresh
    await User.findByIdAndUpdate(decoded.userId, { lastLogin: new Date() });

    const response = NextResponse.json({
      success: true,
      message: "Token refreshed",
      data: { accessToken: newAccessToken },
    });

    response.cookies.set("refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set("access_token", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    const err = error as Error;
    return errorResponse(err.message || "Token refresh failed. Please log in again.", 401);
  }
}
