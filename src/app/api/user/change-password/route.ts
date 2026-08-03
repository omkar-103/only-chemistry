// POST /api/user/change-password
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/utils";
import { z } from "zod";

const changePwSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[a-z]/, "Must contain lowercase")
    .regex(/\d/, "Must contain number")
    .regex(/[^A-Za-z0-9]/, "Must contain special character"),
});

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const validation = changePwSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    const { currentPassword, newPassword } = validation.data;
    await connectDB();

    const user = await User.findById(authResult.user.userId).select("+password");
    if (!user) return errorResponse("User not found", 404);

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) return errorResponse("Current password is incorrect", 400);

    user.password = newPassword;
    // Invalidate all other sessions
    user.sessionToken = undefined as any;
    user.sessionTokenExpiry = undefined as any;
    await user.save();

    return successResponse({}, "Password changed successfully. Please log in again on other devices.");
  } catch (error) {
    console.error("[CHANGE-PW] Error:", (error as Error).message);
    return errorResponse("Failed to change password", 500);
  }
}
