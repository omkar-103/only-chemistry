// POST /api/exams/[id]/save-response — Auto-save individual answer
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
    const { attemptId, questionId, selectedOptions, isMarkedForReview, timeTakenSeconds } = body;

    await connectDB();

    const attempt = await ExamAttempt.findOne({
      _id: attemptId,
      examId: id,
      studentId: authResult.user.userId,
      status: "in_progress",
    });

    if (!attempt) return errorResponse("Active attempt not found", 404);

    // Upsert response for this question
    const existingIndex = attempt.responses.findIndex(
      (r) => r.questionId.toString() === questionId
    );

    const responseData = {
      questionId,
      selectedOptions: selectedOptions || [],
      timeTakenSeconds: timeTakenSeconds || 0,
      isMarkedForReview: isMarkedForReview || false,
      visitedAt: existingIndex === -1 ? new Date() : attempt.responses[existingIndex].visitedAt,
      answeredAt: selectedOptions?.length > 0 ? new Date() : undefined,
    };

    if (existingIndex === -1) {
      attempt.responses.push(responseData as any);
    } else {
      attempt.responses[existingIndex] = responseData as any;
    }

    await attempt.save();

    return successResponse({}, "Response saved");
  } catch (error) {
    console.error("[SAVE RESPONSE] Error:", (error as Error).message);
    return errorResponse("Failed to save response", 500);
  }
}
