// GET /api/admin/students — All students with filters
// PATCH /api/admin/students/[id] — Update student status
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import { requireAdmin, successResponse, errorResponse, paginatedResponse, parsePagination } from "@/lib/api/utils";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    const query: Record<string, unknown> = { role: "student" };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    if (isActive !== null && isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const [students, total] = await Promise.all([
      User.find(query)
        .select("-password -otp -otpExpiry -sessionToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return paginatedResponse(students, total, page, limit, "Students fetched");
  } catch (error) {
    console.error("[ADMIN STUDENTS] Error:", (error as Error).message);
    return errorResponse("Failed to fetch students", 500);
  }
}
