// POST /api/exams/[id]/start — Start exam attempt
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Exam from "@/lib/db/models/Exam";
import ExamAttempt from "@/lib/db/models/ExamAttempt";
import User from "@/lib/db/models/User";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/utils";

interface RouteParams { params: Promise<{ id: string }> }

// Strip sensitive fields from questions before sending to student
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeQuestion(q: any) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { correctAnswers, explanation, explanationImage, ...safe } = q;
  return safe;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    await connectDB();

    const exam = await Exam.findById(id);
    if (!exam || exam.status !== "published") {
      return errorResponse("Exam not found or not available", 404);
    }

    // Check purchase (for paid exams)
    if (!exam.isFree) {
      const student = await User.findById(authResult.user.userId).lean();
      const hasPurchased = student?.purchasedExams?.some(
        (p) => p.toString() === id
      );
      if (!hasPurchased) {
        return errorResponse("Please purchase this exam to start", 403);
      }
    }

    // Check max attempts
    const attemptCount = await ExamAttempt.countDocuments({
      examId: id,
      studentId: authResult.user.userId,
      status: { $in: ["submitted", "timed_out", "auto_submitted"] },
    });

    if (attemptCount >= exam.maxAttempts) {
      return errorResponse(
        `Maximum attempts (${exam.maxAttempts}) reached for this exam`,
        403
      );
    }

    // Check for in-progress attempt
    const existingAttempt = await ExamAttempt.findOne({
      examId: id,
      studentId: authResult.user.userId,
      status: "in_progress",
    });

    if (existingAttempt) {
      // Resume existing attempt — serialize then sanitize
      const rawQuestions = JSON.parse(JSON.stringify(exam.questions));
      const questions = rawQuestions.map(sanitizeQuestion);
      return successResponse(
        {
          attemptId: existingAttempt._id,
          questions,
          totalDuration: exam.totalDuration,
          autoDistributeTime: exam.autoDistributeTime,
          startedAt: existingAttempt.startedAt,
          responses: existingAttempt.responses,
        },
        "Resuming existing attempt"
      );
    }

    // Create new attempt
    const attempt = await ExamAttempt.create({
      examId: id,
      studentId: authResult.user.userId,
      startedAt: new Date(),
    });

    // Increment exam attempt count
    await Exam.findByIdAndUpdate(id, { $inc: { attemptCount: 1 } });

    // Serialize from Mongoose → plain JS objects
    let rawQuestions = JSON.parse(JSON.stringify(exam.questions));

    // Shuffle if needed
    if (exam.shuffleQuestions) {
      rawQuestions = rawQuestions.sort(() => Math.random() - 0.5);
    }
    if (exam.shuffleOptions) {
      rawQuestions = rawQuestions.map((q: any) => ({
        ...q,
        options: [...(q.options ?? [])].sort(() => Math.random() - 0.5),
      }));
    }

    // Strip answers for student view
    const sanitizedQuestions = rawQuestions.map(sanitizeQuestion);

    return successResponse(
      {
        attemptId: attempt._id,
        questions: sanitizedQuestions,
        totalDuration: exam.totalDuration,
        autoDistributeTime: exam.autoDistributeTime,
        startedAt: attempt.startedAt,
      },
      "Exam started successfully",
      201
    );
  } catch (error) {
    console.error("[EXAM START] Error:", (error as Error).message);
    return errorResponse("Failed to start exam", 500);
  }
}
