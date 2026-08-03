// GET /api/admin/sessions — Active student sessions
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import ExamAttempt from "@/lib/db/models/ExamAttempt";
import User from "@/lib/db/models/User";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;

  try {
    await connectDB();

    // Get all in-progress exam attempts started in the last 24h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const activeAttempts = await ExamAttempt.find({
      status: "in_progress",
      startedAt: { $gte: since },
    })
      .populate("studentId", "name email phone")
      .populate("examId", "title category totalDuration")
      .sort({ startedAt: -1 })
      .lean() as any[];

    // Also get recently active students (logged in last 30 min)
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    const recentStudents = await User.find({
      role: "student",
      lastLogin: { $gte: thirtyMinsAgo },
      isActive: true,
    })
      .select("name email lastLogin")
      .lean() as any[];

    const sessions = activeAttempts.map(attempt => {
      const elapsed = Math.round((Date.now() - new Date(attempt.startedAt).getTime()) / 60000);
      const examDuration = attempt.examId?.totalDuration || 60;
      const timeRemaining = Math.max(0, examDuration - elapsed);
      const totalViolations = attempt.violations?.length || 0;

      return {
        attemptId:      attempt._id,
        studentId:      attempt.studentId?._id,
        studentName:    attempt.studentId?.name || "Unknown",
        studentEmail:   attempt.studentId?.email || "",
        examId:         attempt.examId?._id,
        examTitle:      attempt.examId?.title || "Unknown Exam",
        examCategory:   attempt.examId?.category || "",
        startedAt:      attempt.startedAt,
        elapsedMinutes: elapsed,
        timeRemaining,
        totalViolations,
        tabSwitchCount:     attempt.tabSwitchCount || 0,
        fullscreenExitCount: attempt.fullscreenExitCount || 0,
        browser:        attempt.sessionMetadata?.browser || "Unknown",
        device:         attempt.sessionMetadata?.device || "Unknown",
        os:             attempt.sessionMetadata?.os || "Unknown",
        ip:             attempt.sessionMetadata?.ip || "unknown",
        answeredCount:  attempt.responses?.filter((r: any) => r.selectedOptions?.length > 0).length || 0,
        totalQuestions: attempt.responses?.length || 0,
      };
    });

    return successResponse({
      activeExams:    sessions,
      recentStudents: recentStudents.map(s => ({
        _id:       s._id,
        name:      s.name,
        email:     s.email,
        lastLogin: s.lastLogin,
        idleMinutes: Math.round((Date.now() - new Date(s.lastLogin).getTime()) / 60000),
      })),
      summary: {
        totalActive:  sessions.length,
        totalRecent:  recentStudents.length,
        withViolations: sessions.filter(s => s.totalViolations > 0).length,
      },
    }, "Sessions fetched");

  } catch (err) {
    console.error("[SESSIONS]", err);
    return errorResponse("Failed to fetch sessions", 500);
  }
}
