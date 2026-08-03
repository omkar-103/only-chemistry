// GET /api/results — Student's exam attempt history
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import ExamAttempt from "@/lib/db/models/ExamAttempt";
import { requireAuth, successResponse, paginatedResponse, errorResponse } from "@/lib/api/utils";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      status: { $in: ["submitted", "timed_out", "auto_submitted"] },
    };

    // Students see only their own
    if (authResult.user.role === "student") {
      query.studentId = authResult.user.userId;
    }

    const [attempts, total] = await Promise.all([
      ExamAttempt.find(query)
        .populate("examId", "title category difficulty")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ExamAttempt.countDocuments(query),
    ]);

    return paginatedResponse(attempts, total, page, limit, "Results fetched");
  } catch (error) {
    console.error("[RESULTS] Error:", (error as Error).message);
    return errorResponse("Failed to fetch results", 500);
  }
}
