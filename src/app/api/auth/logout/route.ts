// POST /api/auth/logout
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { requireAuth, createAuditLog, getClientIP } from "@/lib/api/utils";

export async function POST(req: NextRequest) {
  const result = await requireAuth(req);
  if (result instanceof NextResponse) {
    // Even if not authenticated, clear cookies
    const response = NextResponse.json({ success: true, message: "Logged out" });
    response.cookies.delete("access_token");
    response.cookies.delete("refresh_token");
    return response;
  }

  const { user } = result;
  const ip = getClientIP(req);

  try {
    await connectDB();
    // Invalidate session
    await User.findByIdAndUpdate(user.userId, {
      $unset: { sessionToken: 1, sessionTokenExpiry: 1 },
    });

    await createAuditLog({
      userId: user.userId,
      userEmail: user.email,
      action: "LOGOUT",
      resource: "User",
      ip,
    });
  } catch (error) {
    console.error("[LOGOUT] Error:", (error as Error).message);
  }

  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");
  return response;
}
