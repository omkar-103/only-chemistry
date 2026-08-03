// GET /api/admin/analytics — Detailed exam performance analytics
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db/connection";
import ExamAttempt from "@/lib/db/models/ExamAttempt";
import Exam from "@/lib/db/models/Exam";
import User from "@/lib/db/models/User";
import Payment from "@/lib/db/models/Payment";
import { requireAdmin, successResponse, errorResponse } from "@/lib/api/utils";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await connectDB();

    const [
      examPerformance,
      categoryStats,
      dailySignups,
      topStudents,
    ] = await Promise.all([
      // Per-exam performance
      ExamAttempt.aggregate([
        { $match: { status: { $in: ["submitted", "auto_submitted", "timed_out"] } } },
        {
          $group: {
            _id: "$examId",
            attempts: { $sum: 1 },
            avgScore: { $avg: "$percentage" },
            passRate: { $avg: { $cond: ["$isPassed", 1, 0] } },
            avgTime: { $avg: "$timeTakenMinutes" },
          },
        },
        { $sort: { attempts: -1 } },
        { $limit: 10 },
        { $lookup: { from: "exams", localField: "_id", foreignField: "_id", as: "exam" } },
        { $unwind: "$exam" },
        {
          $project: {
            examTitle: "$exam.title",
            category: "$exam.category",
            attempts: 1,
            avgScore: { $round: ["$avgScore", 1] },
            passRate: { $round: [{ $multiply: ["$passRate", 100] }, 1] },
            avgTime: { $round: ["$avgTime", 0] },
          },
        },
      ]),

      // Category-wise stats
      ExamAttempt.aggregate([
        { $match: { status: { $in: ["submitted", "auto_submitted"] } } },
        { $lookup: { from: "exams", localField: "examId", foreignField: "_id", as: "exam" } },
        { $unwind: "$exam" },
        {
          $group: {
            _id: "$exam.category",
            totalAttempts: { $sum: 1 },
            avgScore: { $avg: "$percentage" },
          },
        },
        { $sort: { totalAttempts: -1 } },
      ]),

      // Daily signups last 30 days
      User.aggregate([
        {
          $match: {
            role: "student",
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Top performing students
      ExamAttempt.aggregate([
        { $match: { status: { $in: ["submitted", "auto_submitted"] } } },
        {
          $group: {
            _id: "$studentId",
            totalAttempts: { $sum: 1 },
            avgScore: { $avg: "$percentage" },
            passedCount: { $sum: { $cond: ["$isPassed", 1, 0] } },
          },
        },
        { $sort: { avgScore: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "student" } },
        { $unwind: "$student" },
        {
          $project: {
            studentName: "$student.name",
            studentEmail: "$student.email",
            totalAttempts: 1,
            avgScore: { $round: ["$avgScore", 1] },
            passedCount: 1,
          },
        },
      ]),
    ]);

    return successResponse(
      { examPerformance, categoryStats, dailySignups, topStudents },
      "Analytics fetched"
    );
  } catch (error) {
    console.error("[ANALYTICS] Error:", (error as Error).message);
    return errorResponse("Failed to fetch analytics", 500);
  }
}
