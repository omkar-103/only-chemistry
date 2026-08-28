// GET /api/results/[attemptId]
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import ExamAttempt from "@/lib/db/models/ExamAttempt";
import Exam from "@/lib/db/models/Exam";
import { requireAuth, successResponse, errorResponse } from "@/lib/api/utils";

interface RouteParams { params: Promise<{ attemptId: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { attemptId } = await params;
    await connectDB();

    const attempt = await ExamAttempt.findById(attemptId).lean();
    if (!attempt) return errorResponse("Result not found", 404);

    // Students can only view their own results
    if (authResult.user.role === "student" &&
        attempt.studentId.toString() !== authResult.user.userId) {
      return errorResponse("Unauthorized", 403);
    }

    const exam = await Exam.findById(attempt.examId).lean();
    if (!exam) return errorResponse("Exam not found", 404);

    // Check result visibility
    if (exam.resultVisibility === "hidden" && authResult.user.role === "student") {
      return successResponse(
        { attempt: { percentage: attempt.percentage, isPassed: attempt.isPassed, status: attempt.status }, exam: { title: exam.title, resultVisibility: "hidden" } },
        "Result is not visible yet"
      );
    }

    // Build detailed result
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalUnattempted = 0;

    const resultQuestions = exam.resultVisibility === "full"
      ? exam.questions.map((q) => {
          const response = attempt.responses.find(
            (r) => r.questionId.toString() === q._id.toString()
          );
          const selectedOptions = response?.selectedOptions || [];

          let isCorrect = false;
          if (selectedOptions.length > 0) {
            if (q.questionType === "single" || q.questionType === "truefalse") {
              isCorrect = q.correctAnswers.includes(selectedOptions[0]);
            } else {
              const sortedCorrect = [...q.correctAnswers].sort().join(",");
              const sortedSelected = [...selectedOptions].sort().join(",");
              isCorrect = sortedCorrect === sortedSelected;
            }
          }

          if (selectedOptions.length === 0) totalUnattempted++;
          else if (isCorrect) totalCorrect++;
          else totalWrong++;

          return {
            question: {
              _id: q._id,
              questionText: q.questionText,
              questionImage: q.questionImage,
              questionChemicalContents: q.questionChemicalContents,
              questionType: q.questionType,
              options: q.options,
              correctAnswers: q.correctAnswers,
              marks: q.marks,
              negativeMarks: q.negativeMarks,
              explanation: exam.showExplanations ? q.explanation : undefined,
              order: q.order,
            },
            selectedOptions,
            isCorrect,
            marksObtained: isCorrect ? q.marks : (selectedOptions.length > 0 && exam.negativeMarkingEnabled ? -q.negativeMarks : 0),
            timeTakenSeconds: response?.timeTakenSeconds || 0,
          };
        })
      : undefined;

    if (exam.resultVisibility === "score_only") {
      attempt.responses.forEach((r) => {
        const q = exam.questions.find(q => q._id.toString() === r.questionId.toString());
        if (!q) return;
        if (r.selectedOptions.length === 0) { totalUnattempted++; return; }
        const isCorrect = q.questionType === "single" || q.questionType === "truefalse"
          ? q.correctAnswers.includes(r.selectedOptions[0])
          : [...q.correctAnswers].sort().join(",") === [...r.selectedOptions].sort().join(",");
        if (isCorrect) totalCorrect++;
        else totalWrong++;
      });
    }

    return successResponse(
      {
        attempt: {
          _id: attempt._id,
          score: attempt.score,
          totalMarks: attempt.totalMarks,
          percentage: attempt.percentage,
          isPassed: attempt.isPassed,
          status: attempt.status,
          timeTakenMinutes: attempt.timeTakenMinutes,
          startedAt: attempt.startedAt,
          submittedAt: attempt.submittedAt,
        },
        exam: {
          _id: exam._id,
          title: exam.title,
          category: exam.category,
          resultVisibility: exam.resultVisibility,
          showExplanations: exam.showExplanations,
          allowReattempt: exam.allowReattempt,
          passingPercentage: exam.passingPercentage,
        },
        questions: resultQuestions,
        totalCorrect: totalCorrect,
        totalWrong: totalWrong,
        totalUnattempted: totalUnattempted,
      },
      "Result fetched successfully"
    );
  } catch (error) {
    console.error("[RESULT GET] Error:", (error as Error).message);
    return errorResponse("Failed to fetch result", 500);
  }
}
