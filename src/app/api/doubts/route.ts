// GET /api/doubts — Student: own doubts | Admin: all doubts
// POST /api/doubts — Student: submit doubt
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Doubt from "@/lib/db/models/Doubt";
import { requireAuth, successResponse, errorResponse, paginatedResponse, parsePagination } from "@/lib/api/utils";
import { doubtSchema } from "@/lib/validators/schemas";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const { page, limit, skip } = parsePagination(searchParams);

    const query: Record<string, unknown> = {};

    // Students only see their own doubts
    if (authResult.user.role === "student") {
      query.studentId = authResult.user.userId;
    }

    const status = searchParams.get("status");
    if (status) query.status = status;

    const [doubts, total] = await Promise.all([
      Doubt.find(query)
        .populate("studentId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Doubt.countDocuments(query),
    ]);

    return paginatedResponse(doubts, total, page, limit, "Doubts fetched successfully");
  } catch (error) {
    console.error("[DOUBTS GET] Error:", (error as Error).message);
    return errorResponse("Failed to fetch doubts", 500);
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  if (authResult.user.role !== "student") {
    return errorResponse("Only students can submit doubts", 403);
  }

  try {
    const body = await req.json();
    const validation = doubtSchema.safeParse(body);
    if (!validation.success) return errorResponse(validation.error.issues[0].message, 400);

    await connectDB();

    const doubt = await Doubt.create({
      studentId: authResult.user.userId,
      ...validation.data,
    });

    return successResponse(doubt, "Doubt submitted successfully", 201);
  } catch (error) {
    console.error("[DOUBTS POST] Error:", (error as Error).message);
    return errorResponse("Failed to submit doubt", 500);
  }
}
