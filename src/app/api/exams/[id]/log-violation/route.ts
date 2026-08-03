// POST /api/exams/[id]/log-violation — Log exam security violation
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import ExamAttempt from "@/lib/db/models/ExamAttempt";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/utils";

interface RouteParams { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await req.json();
    const { attemptId, type, count = 1 } = body;

    await connectDB();

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      examId: id,
      studentId: authResult.user.userId,
    });

    if (!attempt) return errorResponse("Attempt not found", 404);

    // Find existing violation of this type or add new
    const existingIdx = attempt.violations.findIndex((v) => v.type === type);
    if (existingIdx !== -1) {
      attempt.violations[existingIdx].count += count;
      attempt.violations[existingIdx].timestamp = new Date();
    } else {
      attempt.violations.push({ type, timestamp: new Date(), count });
    }

    await attempt.save();

    // Return total violation count for this type
    const violationCount = attempt.violations.find((v) => v.type === type)?.count || 0;

    return successResponse({ violationCount, type }, "Violation logged");
  } catch (error) {
    console.error("[LOG VIOLATION] Error:", (error as Error).message);
    return errorResponse("Failed to log violation", 500);
  }
}
