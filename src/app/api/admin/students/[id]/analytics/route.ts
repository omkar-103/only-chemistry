// GET /api/admin/students/[id]/analytics — Full student analytics
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import User from "@/lib/db/models/User";
import ExamAttempt from "@/lib/db/models/ExamAttempt";
import Exam from "@/lib/db/models/Exam";
import Payment from "@/lib/db/models/Payment";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";

interface RouteParams { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    await connectDB();

    // ── Student base info ──────────────────────────────────────
    const student = await User.findById(id).select("-password").lean() as any;
    if (!student) return errorResponse("Student not found", 404);

    // ── All completed attempts ─────────────────────────────────
    const attempts = await ExamAttempt.find({
      studentId: id,
      status: { $in: ["submitted", "auto_submitted", "timed_out"] },
    })
      .sort({ createdAt: -1 })
      .populate("examId", "title category subject difficulty passingPercentage totalDuration")
      .lean() as any[];

    // ── Payment history ────────────────────────────────────────
    const payments = await Payment.find({ studentId: id })
      .populate("examId", "title")
      .sort({ createdAt: -1 })
      .lean() as any[];

    // ── Aggregate stats ────────────────────────────────────────
    const totalAttempts    = attempts.length;
    const passedAttempts   = attempts.filter(a => a.isPassed).length;
    const passPercentage   = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
    const avgScore         = totalAttempts > 0
      ? Math.round(attempts.reduce((s, a) => s + (a.percentage || 0), 0) / totalAttempts)
      : 0;
    const totalExamTimeMins = attempts.reduce((s, a) => s + (a.timeTakenMinutes || 0), 0);
    const totalTabSwitches  = attempts.reduce((s, a) => s + (a.tabSwitchCount || 0), 0);
    const totalFSExits      = attempts.reduce((s, a) => s + (a.fullscreenExitCount || 0), 0);

    // ── Per-attempt detail ─────────────────────────────────────
    const examHistory = attempts.map((a, idx) => ({
      attemptId:       a._id,
      attemptNumber:   idx + 1,
      examId:          a.examId?._id,
      examTitle:       a.examId?.title || "Unknown Exam",
      examCategory:    a.examId?.category || "",
      examDifficulty:  a.examId?.difficulty || "",
      score:           a.score || 0,
      totalMarks:      a.totalMarks || 0,
      percentage:      a.percentage || 0,
      isPassed:        a.isPassed || false,
      timeTakenMinutes: a.timeTakenMinutes || 0,
      submittedAt:     a.submittedAt,
      startedAt:       a.startedAt,
      status:          a.status,
      isAutoSubmitted: a.isAutoSubmitted || false,
      submissionReason: a.submissionReason || "manual",
      tabSwitchCount:  a.tabSwitchCount || 0,
      fullscreenExitCount: a.fullscreenExitCount || 0,
      totalViolations: a.totalViolations || 0,
      sessionMetadata: a.sessionMetadata || {},
      correctCount:    a.correctCount || 0,
      incorrectCount:  a.incorrectCount || 0,
      skippedCount:    a.skippedCount || 0,
      totalQuestions:  a.totalQuestions || 0,
      // Include full question-level analytics
      responses:       a.responses || [],
    }));

    return successResponse({
      student: {
        _id:          student._id,
        name:         student.name,
        email:        student.email,
        phone:        student.phone,
        role:         student.role,
        category:     student.category,
        createdAt:    student.createdAt,
        lastLogin:    student.lastLogin,
        purchasedExams: student.purchasedExams?.length || 0,
        isActive:     student.isActive,
      },
      stats: {
        totalAttempts,
        passedAttempts,
        failedAttempts:   totalAttempts - passedAttempts,
        passPercentage,
        avgScore,
        totalExamTimeMins,
        totalTabSwitches,
        totalFSExits,
        totalPayments:    payments.filter(p => p.status === "paid").length,
        totalAmountPaid:  payments
          .filter(p => p.status === "paid")
          .reduce((s, p) => s + (p.amount || 0), 0) / 100,
      },
      examHistory,
      payments: payments.map(p => ({
        _id:         p._id,
        examTitle:   p.examId?.title || "Unknown",
        amount:      (p.amount || 0) / 100,
        status:      p.status,
        createdAt:   p.createdAt,
        orderId:     p.orderId,
      })),
    }, "Student analytics fetched");
  } catch (err) {
    console.error("[STUDENT ANALYTICS]", err);
    return errorResponse("Failed to fetch analytics", 500);
  }
}
