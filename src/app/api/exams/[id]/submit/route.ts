// POST /api/exams/[id]/submit — Submit exam, calculate score, store full analytics
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import Exam from "@/lib/db/models/Exam";
import ExamAttempt from "@/lib/db/models/ExamAttempt";
import Notification from "@/lib/db/models/Notification";
import { requireAuth, successResponse, errorResponse, getClientIP } from "@/lib/api/utils";

interface RouteParams { params: Promise<{ id: string }> }

function isAnswerCorrect(questionType: string, correct: string[], selected: string[]): boolean {
  if (questionType === "single" || questionType === "truefalse") {
    return selected.length === 1 && correct.includes(selected[0]);
  }
  const sortedCorrect   = [...correct].sort().join(",");
  const sortedSelected  = [...selected].sort().join(",");
  return sortedCorrect === sortedSelected;
}

function parseUserAgent(ua: string) {
  const browser = ua.includes("Chrome") ? "Chrome"
    : ua.includes("Firefox") ? "Firefox"
    : ua.includes("Safari") ? "Safari"
    : ua.includes("Edge") ? "Edge"
    : "Unknown";

  const os = ua.includes("Windows") ? "Windows"
    : ua.includes("Mac") ? "macOS"
    : ua.includes("Linux") ? "Linux"
    : ua.includes("Android") ? "Android"
    : ua.includes("iPhone") ? "iOS"
    : "Unknown";

  const device = ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone")
    ? "Mobile" : "Desktop";

  return { browser, os, device };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { id } = await params;
    const body = await req.json();
    const {
      attemptId,
      responses,
      isAutoSubmit    = false,
      isTimedOut      = false,
      submissionReason = "manual",
      timeRemainingSeconds = 0,
      sessionMetadata,
    } = body;

    await connectDB();

    const [exam, attempt] = await Promise.all([
      Exam.findById(id),
      ExamAttempt.findOne({ _id: attemptId, examId: id, studentId: authResult.user.userId }),
    ]);

    if (!exam)    return errorResponse("Exam not found", 404);
    if (!attempt) return errorResponse("Attempt not found", 404);
    if (attempt.status !== "in_progress") {
      return errorResponse("This attempt has already been submitted", 400);
    }

    // ── Score calculation + per-question analytics ─────────────
    let totalScore          = 0;
    let totalPossibleMarks  = 0;
    let totalCorrect        = 0;
    let totalWrong          = 0;
    let totalUnanswered     = 0;
    let totalMarkedReview   = 0;

    const evaluatedResponses = responses.map((resp: any, idx: number) => {
      const question = exam.questions.find(q => q._id.toString() === resp.questionId);
      if (!question) return resp;

      totalPossibleMarks += question.marks;
      const selected = resp.selectedOptions || [];

      let isCorrect    = false;
      let marksAwarded = 0;
      let negMarks     = 0;

      if (selected.length === 0) {
        totalUnanswered++;
      } else {
        isCorrect = isAnswerCorrect(question.questionType, question.correctAnswers, selected);
        if (isCorrect) {
          marksAwarded = question.marks;
          totalScore  += question.marks;
          totalCorrect++;
        } else {
          if (exam.negativeMarkingEnabled) {
            negMarks     = question.negativeMarks;
            totalScore  -= question.negativeMarks;
          }
          totalWrong++;
        }
      }

      if (resp.isMarkedForReview) totalMarkedReview++;

      return {
        questionId:        resp.questionId,
        questionNo:        idx + 1,
        selectedOptions:   selected,
        correctAnswers:    question.correctAnswers,
        isCorrect,
        marksAwarded,
        negativeMarks:     negMarks,
        timeTakenSeconds:  resp.timeTakenSeconds || 0,
        startTime:         resp.startTime ? new Date(resp.startTime) : undefined,
        endTime:           resp.endTime   ? new Date(resp.endTime)   : undefined,
        isMarkedForReview: !!resp.isMarkedForReview,
        visitCount:        resp.visitCount     || 1,
        answerChanged:     resp.answerChanged  || false,
        finalAnswer:       selected,
        visitedAt:         resp.visitedAt  ? new Date(resp.visitedAt)  : undefined,
        answeredAt:        resp.answeredAt ? new Date(resp.answeredAt) : undefined,
      };
    });

    const safeScore      = Math.max(0, totalScore);
    const percentage     = totalPossibleMarks > 0 ? Math.round((safeScore / totalPossibleMarks) * 100) : 0;
    const isPassed       = percentage >= exam.passingPercentage;
    const endTime        = new Date();
    const timeTakenSecs  = Math.round((endTime.getTime() - attempt.startedAt.getTime()) / 1000);
    const timeTakenMins  = Math.round(timeTakenSecs / 60);
    const totalExamSecs  = exam.totalDuration * 60;

    const status = isAutoSubmit ? "auto_submitted" : isTimedOut ? "timed_out" : "submitted";

    // ── Session metadata ───────────────────────────────────────
    const ua = req.headers.get("user-agent") || "";
    const ip = getClientIP(req);
    const { browser, os, device } = parseUserAgent(ua);

    const meta = {
      browser:   sessionMetadata?.browser  || browser,
      device:    sessionMetadata?.device   || device,
      os:        sessionMetadata?.os       || os,
      ip:        sessionMetadata?.ip       || ip,
      userAgent: sessionMetadata?.userAgent || ua,
      loginTime: sessionMetadata?.loginTime ? new Date(sessionMetadata.loginTime) : undefined,
    };

    // ── Violation counters from existing attempt ───────────────
    const violations    = attempt.violations || [];
    const tabCount      = violations.filter(v => v.type === "tab_switch").length;
    const fsCount       = violations.filter(v => v.type === "fullscreen_exit").length;
    const totalViol     = violations.length;

    // ── Save full analytics ───────────────────────────────────
    await ExamAttempt.findByIdAndUpdate(attemptId, {
      $set: {
        responses:             evaluatedResponses,
        status,
        isAutoSubmitted:       isAutoSubmit || isTimedOut,
        submissionReason:      isAutoSubmit ? submissionReason : isTimedOut ? "time_up" : "manual",
        submittedAt:           endTime,
        totalExamTimeSeconds:  totalExamSecs,
        timeTakenSeconds:      timeTakenSecs,
        timeRemainingSeconds:  timeRemainingSeconds,
        score:                 safeScore,
        totalMarks:            totalPossibleMarks,
        percentage:            Math.max(0, percentage),
        isPassed,
        timeTakenMinutes:      timeTakenMins,
        totalQuestions:        exam.questions.length,
        answeredCount:         totalCorrect + totalWrong,
        correctCount:          totalCorrect,
        incorrectCount:        totalWrong,
        skippedCount:          totalUnanswered,
        markedForReviewCount:  totalMarkedReview,
        tabSwitchCount:        tabCount,
        fullscreenExitCount:   fsCount,
        totalViolations:       totalViol,
        sessionMetadata:       meta,
      },
    });

    // ── Notify student ─────────────────────────────────────────
    if (exam.resultVisibility !== "hidden") {
      await Notification.create({
        userId:  authResult.user.userId,
        type:    "result_published",
        title:   `Result: ${exam.title}`,
        message: `${isPassed ? "🎉 Passed!" : "❌ Failed."} Score: ${safeScore}/${totalPossibleMarks} (${Math.max(0,percentage)}%)`,
        link:    `/results/${attemptId}`,
        priority: isPassed ? "medium" : "high",
      });
    }

    return successResponse(
      {
        attemptId,
        score:           safeScore,
        totalMarks:      totalPossibleMarks,
        percentage:      Math.max(0, percentage),
        isPassed,
        totalCorrect,
        totalWrong,
        totalUnanswered,
        timeTakenMinutes: timeTakenMins,
        resultVisibility: exam.resultVisibility,
      },
      "Exam submitted successfully"
    );
  } catch (error) {
    console.error("[EXAM SUBMIT] Error:", (error as Error).message);
    return errorResponse("Failed to submit exam", 500);
  }
}
