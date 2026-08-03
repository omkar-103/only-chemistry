// PATCH /api/user/profile — Update student profile
// POST  /api/user/change-password — Change password
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/utils";
import { updateProfileSchema } from "@/lib/validators/schemas";

export async function PATCH(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await req.json();
    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    await connectDB();
    const user = await User.findByIdAndUpdate(
      authResult.user.userId,
      { $set: validation.data },
      { new: true }
    ).select("-password -otp -otpExpiry -sessionToken");

    if (!user) return errorResponse("User not found", 404);
    return successResponse(user, "Profile updated successfully");
  } catch (error) {
    console.error("[PROFILE] Error:", (error as Error).message);
    return errorResponse("Failed to update profile", 500);
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const user = await User.findById(authResult.user.userId)
      .select("-password -otp -otpExpiry -sessionToken")
      .populate("purchasedExams", "title category")
      .lean();

    if (!user) return errorResponse("User not found", 404);
    return successResponse(user, "Profile fetched");
  } catch (error) {
    return errorResponse("Failed to fetch profile", 500);
  }
}
